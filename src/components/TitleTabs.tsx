import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Tabs,
  Tab,
  styled,
  Typography,
  TypographyProps,
} from '@mui/material';
import { TabBox } from '../control';
import { shallowEqual, useSelector } from 'react-redux';
import TitleRecord from './TitleRecord';
import { TitleUploader } from './TitleUploader';
import { IMediaTitleStrings } from '../model';
import { mediaTitleSelector } from '../selector';
import { useTitleSave } from './useTitleSave';
import { UnsavedContext } from '../context/UnsavedContext';
import { useSnackBar } from '../hoc/SnackBar';

const StatusMessage = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginRight: theme.spacing(2),
  alignSelf: 'center',
  color: theme.palette.primary.dark,
}));

interface IProps {
  titlekey: string;
  myPlanId?: string;
  passageId?: string;
  defaultFilename: string;
  playing: boolean;
  changeTab?: (v: number) => void;
  // canRecord?: () => boolean;
  onRecording?: (recording: boolean) => void;
  onDialogVisible?: (show: boolean) => void;
  onMediaIdChange: (mediaId: string) => void;
}

const TitleTabs = (props: IProps) => {
  const {
    titlekey,
    myPlanId,
    passageId,
    defaultFilename,
    playing,
    changeTab,
    // canRecord,
    onRecording,
    onMediaIdChange,
    onDialogVisible,
  } = props;
  const [tab, setTab] = useState(0); //verified this is not used in a function 2/18/25
  const cancelled = useRef<boolean>(false);
  const canSaveRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [canSaveRecording, setCanSaveRecording] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean | undefined>();
  const [statusText, setStatusText] = useState('');
  const saving = useRef(false);
  const t: IMediaTitleStrings = useSelector(mediaTitleSelector, shallowEqual);
  const {
    toolChanged,
    toolsChanged,
    startSave,
    saveRequested,
    saveCompleted,
    clearRequested,
    clearCompleted,
    // isChanged,
  } = useContext(UnsavedContext).state;
  const { showMessage } = useSnackBar();

  const toolId = useMemo(() => 'MediaTitle-' + titlekey, [titlekey]);
  const recToolId = useMemo(() => toolId + 'rec', [toolId]);

  const onMyRecording = (r: boolean) => {
    if (r) {
      toolChanged(toolId, true);
      toolChanged(recToolId, true);
    }
    setRecording(r);
    onRecording && onRecording(r);
  };

  const reset = () => {
    setRecording(false);
    onDialogVisible?.(false);
    setStatusText('');
    saving.current = false;
    setCanSaveRecording(false);
    onMyRecording(false);
    toolChanged(toolId, false);
    toolChanged(recToolId, false);
  };

  const { uploadMedia } = useTitleSave({
    myPlanId,
    passageId,
    onMediaIdChange,
    onDialogVisible,
    reset,
    setUploadSuccess,
  });

  const handleSave = (e?: any) => {
    e?.stopPropagation();
    if (saving.current) {
      showMessage(t.saving);
      return;
    }
    saving.current = true;
    if (onRecording && !saveRequested(recToolId)) {
      startSave(recToolId);
    }
    setStatusText(t.saving);
    onMyRecording(false);
  };

  useEffect(() => {
    if (saveRequested(toolId) && !saving.current) {
      if (canSaveRef.current) handleSave();
      else {
        saveCompleted(toolId);
      }
    } else if (clearRequested(toolId)) {
      reset();
      clearCompleted(toolId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, canSaveRecording]);

  const handleChange = (event: any, value: number) => {
    setTab(value);
    if (changeTab) {
      changeTab(value);
    }
  };

  const last = 1;

  // const handleRecord = (e: any) => {
  //   e.stopPropagation();
  //   if (canRecord && !canRecord()) {
  //     return;
  //   }
  //   setPlaying?.(false);
  //   setStartRecord?.(true);
  // };

  const handleMyRecording = (r: boolean) => {
    if (r) {
      if (playing) {
        showMessage(`still playing`);
        return;
      }
      if (recording) {
        showMessage(`still recording`);
        return;
      }
      if (saving.current) {
        showMessage(`still saving`);
        return;
      }
    }
    if (r) {
      toolChanged(toolId, true);
      toolChanged(recToolId, true);
    }
    setRecording(r);
    onRecording && onRecording(r);
  };

  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSaveRef.current) {
      canSaveRef.current = valid;
      setCanSaveRecording(valid);
      //if (valid) onChanged(true);
    }
  };

  const handleClose = () => {
    reset();
    onDialogVisible?.(false);
    setTab(0);
  };

  return (
    <TabBox>
      <AppBar position="static" color="default">
        <Tabs
          value={tab || 0}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t.record} />
          <Tab label={t.upload} />
        </Tabs>
      </AppBar>
      {((tab || 0) === 0 || tab > last) && (
        <TitleRecord
          defaultFilename={defaultFilename}
          recToolId={recToolId}
          onMyRecording={handleMyRecording}
          handleSetCanSave={handleSetCanSave}
          uploadMedia={uploadMedia}
          setStatusText={setStatusText}
          uploadSuccess={uploadSuccess}
          onCancel={handleClose}
          onSave={handleSave}
        />
      )}
      {tab === 1 && (
        <TitleUploader
          hasRights={true}
          isOpen={tab === 1}
          onOpen={handleClose}
          cancelled={cancelled}
          uploadMethod={uploadMedia}
          onSave={handleSave}
        />
      )}
      <StatusMessage variant="caption">{statusText}</StatusMessage>
    </TabBox>
  );
};

export default TitleTabs;
