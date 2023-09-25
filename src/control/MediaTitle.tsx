import {
  useState,
  ChangeEvent,
  MouseEvent,
  useEffect,
  useRef,
  useContext,
} from 'react';
import {
  IconButton,
  OutlinedInput,
  OutlinedInputProps,
  InputLabel,
  InputAdornment,
  FormControl,
  Typography,
  TypographyProps,
  Tooltip,
} from '@mui/material';
// import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/MicOutlined';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import * as actions from '../store';
import { IKeyTermsStrings } from '../model';
import { useSnackBar } from '../hoc/SnackBar';
import { keyTermsSelector } from '../selector';
import { waitForIt } from '../utils';
import MediaRecord from '../components/MediaRecord';
import MediaPlayer from '../components/MediaPlayer';
import { ArtifactTypeSlug, remoteIdNum, useArtifactType } from '../crud';
import { useGlobal } from 'reactn';
import { TokenContext } from '../context/TokenProvider';
import { UploadType } from '../components/MediaUpload';

const ColumnDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const StyledInput = styled(OutlinedInput)<OutlinedInputProps>(() => ({
  '& input': {
    paddingTop: '1px',
    paddingBottom: '1px',
  },
}));

const StatusMessage = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginRight: theme.spacing(2),
  alignSelf: 'center',
  color: theme.palette.primary.dark,
}));
interface ITitle {
  title: string;
  mediaId: string | undefined;
}
interface IProps {
  row: ITitle;
  defaultFilename: string;
  /*
  canRecord: () => boolean;
  onOk: (row: ITitle) => void;
  onCancel: () => void;
  setCanSaveRecording: (canSave: boolean) => void;
  onTextChange: (txt: string, row: ITitle) => void;
  onSetRecordRow: (row: ITitle | undefined) => void;
  */
  onChanged: (changed: boolean) => void;
  onRecording: (recording: boolean) => void;
  afterUploadCb: (mediaId: string) => Promise<void>;
}

export default function MediaTitle(props: IProps) {
  const {
    row,
    defaultFilename,
    //onOk,
    //onCancel,
    //canRecord,
    //setCanSaveRecording,
    //onTextChange,
    //onSetRecordRow,
    onChanged,
    onRecording,
    afterUploadCb,
  } = props;
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: actions.NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => dispatch(actions.uploadComplete);
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [offline] = useGlobal('offline');
  const [mediaId, setMediaId] = useState(row.mediaId);
  const [canSave, setCanSave] = useState(false);
  const [curText, setCurText] = useState(row.title ?? '');
  const [startRecord, setStartRecord] = useState(false);
  const [statusText, setStatusText] = useState('');
  const fileList = useRef<File[]>();
  const doRecordRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  // const [myChanged, setMyChanged] = useState(false);
  const { getTypeId } = useArtifactType();
  const tokenCtx = useContext(TokenContext);
  const { accessToken } = tokenCtx.state;

  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);
  const saving = useRef(false);
  const { showMessage } = useSnackBar();
  const getPlanId = () => remoteIdNum('plan', plan, memory.keyMap) || plan;

  const TitleId = getTypeId(ArtifactTypeSlug.Title);

  useEffect(() => {
    setMediaId(row.mediaId ?? '');
    setCurText(row.title ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSave) {
      setCanSave(valid);
      //setCanSaveRecording(valid);
      if (valid) onChanged(true);
    }
  };

  const onMyRecording = (r: boolean) => {
    setRecording(r);
    onRecording(r);
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (recording) {
      showMessage(t.recording);
      return;
    }
    setCurText(e.target.value);
    //onTextChange(e.target.value, row);
    onChanged(true);
  };

  const handleRecord = () => {
    setPlaying(false);
    setStartRecord(true);
    //onSetRecordRow(row);
  };

  const handleOk = () => {
    if (saving.current) {
      showMessage(t.saving);
      return;
    }
    saving.current = true;
    //onOk(row);
    setStatusText(t.saving);
    if (doRecordRef.current) setRecording(false);
    onRecording(false);
  };

  const reset = () => {
    if (doRecordRef.current) setRecording(false);
    setStatusText('');
    setCurText('');
    doRecordRef.current = false;
    saving.current = false;
    //onSetRecordRow(undefined);
    onRecording(false);
  };

  const handleCancel = () => {
    //onCancel();
    reset();
  };
  const getUserId = () =>
    remoteIdNum('user', user || '', memory.keyMap) || user;

  const itemComplete = () => {};

  const uploadMedia = async (files: File[]) => {
    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: files[0].type,
      artifactTypeId: TitleId,
      recordedByUserId: getUserId(),
      userId: getUserId(),
    };
    nextUpload({
      record: mediaFile,
      files,
      n: 0,
      token: accessToken || '',
      offline: offline,
      errorReporter: undefined, //TODO
      uploadType: UploadType.Media,
      cb: itemComplete,
    });
  };
  useEffect(() => {
    if (startRecord)
      try {
        waitForIt(
          'stop playing',
          () => true, //canRecord(),
          () => false,
          100
        ).then(() => {
          doRecordRef.current = true;
          setStartRecord(false);
        });
      } catch {
        //do it anyway...
        doRecordRef.current = true;
        setStartRecord(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRecord, playing]);

  const handleMouseDownSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const hasContent = () => doRecordRef.current || Boolean(curText);
  const playEnded = () => {
    setPlaying(false);
  };
  return (
    <ColumnDiv>
      <FormControl sx={{ width: 'max-content' }} variant="outlined">
        <InputLabel htmlFor="outlined-adornment-term">{'\u200B'}</InputLabel>
        <StyledInput
          id="outlined-adornment-term"
          value={curText}
          onChange={handleTextChange}
          size="small"
          multiline
          placeholder={'xx Title'}
          startAdornment={
            <InputAdornment position="start">
              <Tooltip title={t.record}>
                <IconButton
                  id="record-translation"
                  aria-label="record target term"
                  onClick={handleRecord}
                  onMouseDown={handleMouseDownSave}
                  disabled={recording}
                  edge="start"
                >
                  <MicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              {hasContent() && (
                <>
                  <Tooltip title={t.save}>
                    <span>
                      <IconButton
                        id="save-translation"
                        aria-label="save target term"
                        onClick={handleOk}
                        onMouseDown={handleMouseDownSave}
                        disabled={recording || (!canSave && !curText)}
                        edge="end"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t.cancel}>
                    <span>
                      <IconButton
                        id="cancel-translation"
                        aria-label="save target term"
                        onClick={handleCancel}
                        onMouseDown={handleMouseDownSave}
                        disabled={recording}
                        edge="end"
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>{' '}
                    </span>
                  </Tooltip>
                </>
              )}
            </InputAdornment>
          }
        />
      </FormControl>
      {doRecordRef.current && (
        <MediaRecord
          toolId={'MediaTitle'}
          onRecording={onRecording}
          uploadMethod={uploadMedia}
          defaultFilename={defaultFilename}
          allowWave={false}
          showFilename={false}
          setCanSave={handleSetCanSave}
          setStatusText={setStatusText}
          size={200}
          autoStart={true}
        />
      )}
      <MediaPlayer
        srcMediaId={mediaId || ''}
        requestPlay={playing}
        onEnded={playEnded}
      />
      <StatusMessage variant="caption">{statusText}</StatusMessage>
    </ColumnDiv>
  );
}
