import {
  Button,
  TextField,
  Tooltip,
  styled,
  Typography,
  TypographyProps,
} from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import MicIcon from '@mui/icons-material/MicOutlined';
import { waitForIt } from '../../utils';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import MediaRecord from '../MediaRecord';
import { ICommentEditorStrings, ISharedStrings, IState } from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { localStrings, sharedSelector } from '../../selector';
import { UnsavedContext } from '../../context/UnsavedContext';

const RowDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
}));

const ColumnDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const StatusMessage = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginRight: theme.spacing(2),
  alignSelf: 'center',
  color: theme.palette.primary.dark,
}));

interface IStateProps {}
interface IProps extends IStateProps {
  toolId: string;
  comment: string;
  fileName: string;
  cancelOnlyIfChanged?: boolean;
  uploadMethod: (files: File[]) => Promise<void>;
  refresh: number;
  onOk?: () => void;
  onCancel?: () => void;
  setCanSaveRecording: (canSave: boolean) => void;
  onTextChange: (txt: string) => void;
}
export const commentEditorSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'commentEditor' });

export const CommentEditor = (props: IProps) => {
  const {
    toolId,
    comment,
    fileName,
    cancelOnlyIfChanged,
    uploadMethod,
    refresh,
    onOk,
    onCancel,
    setCanSaveRecording,
    onTextChange,
  } = props;
  const {
    playing,
    itemPlaying,
    commentPlaying,
    commentRecording,
    setCommentRecording,
  } = useContext(PassageDetailContext).state;
  const t: ICommentEditorStrings = useSelector(
    commentEditorSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const [canSave, setCanSave] = useState(false);
  const [curText, setCurText] = useState(comment);
  const [startRecord, setStartRecord] = useState(false);
  const [statusText, setStatusText] = useState('');
  const doRecordRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [myChanged, setMyChanged] = useState(false);
  const {
    toolsChanged,
    toolChanged,
    startSave,
    saveRequested,
    clearRequested,
    clearCompleted,
    isChanged,
  } = useContext(UnsavedContext).state;

  useEffect(() => {
    return () => {
      if (doRecordRef.current) setCommentRecording(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    var changed = isChanged(toolId);
    if (myChanged !== changed) setMyChanged(changed);
    if (saveRequested(toolId)) handleOk();
    else if (clearRequested(toolId)) handleCancel();
    else if (changed) setStatusText(t.unsaved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, toolId]);

  useEffect(() => {
    if (startRecord)
      try {
        waitForIt(
          'stop playing',
          () => !playing && !itemPlaying && !commentPlaying,
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
  }, [startRecord, playing, itemPlaying, commentPlaying]);

  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSave) {
      setCanSave(valid);
      setCanSaveRecording(valid);
      if (valid) toolChanged(toolId, true);
    }
  };
  const onRecording = (r: boolean) => {
    setRecording(r);
  };
  const handleTextChange = (e: any) => {
    setCurText(e.target.value);
    onTextChange(e.target.value);
    toolChanged(toolId, true);
  };

  const handleOk = () => {
    //start the passage recorder if it's going...
    if (!saveRequested(toolId)) {
      startSave(toolId);
    }
    onOk && onOk();
    setStatusText(t.saving);
    if (doRecordRef.current) setCommentRecording(false);
  };
  const handleCancel = () => {
    onCancel && onCancel();
    reset();
  };

  const handleRecord = () => {
    setStartRecord(true);
    setCommentRecording(true);
  };

  const reset = () => {
    if (doRecordRef.current) setCommentRecording(false);
    setStatusText('');
    setCurText('');
    doRecordRef.current = false;
    clearCompleted(toolId);
  };

  useEffect(() => {
    if (refresh > 0) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return (
    <ColumnDiv id="commentedit">
      <TextField
        margin="dense"
        id="commenttext"
        value={curText}
        onChange={handleTextChange}
        fullWidth
        multiline
        label={t.comment}
        focused
      />
      {doRecordRef.current && (
        <MediaRecord
          toolId={toolId}
          onRecording={onRecording}
          uploadMethod={uploadMethod}
          defaultFilename={fileName}
          allowWave={false}
          showFilename={false}
          setCanSave={handleSetCanSave}
          setStatusText={setStatusText}
          size={200}
          autoStart={true}
        />
      )}
      <RowDiv>
        {!doRecordRef.current ? (
          <Tooltip title={commentRecording ? t.recordUnavailable : t.record}>
            <span>
              <Button
                id="record"
                onClick={handleRecord}
                disabled={commentRecording}
              >
                <MicIcon />
              </Button>
            </span>
          </Tooltip>
        ) : (
          <div>{'\u00A0'}</div>
        )}
        <div>
          <StatusMessage variant="caption">{statusText}</StatusMessage>
          {onOk &&
            (!cancelOnlyIfChanged || doRecordRef.current || myChanged) && (
              <Tooltip title={ts.cancel}>
                <span>
                  <Button
                    id="cancel"
                    onClick={handleCancel}
                    sx={{ color: 'background.paper' }}
                    disabled={recording}
                  >
                    <CancelIcon />
                  </Button>
                </span>
              </Tooltip>
            )}
          {onOk && (
            <Tooltip title={ts.save}>
              <span>
                <Button
                  id="ok"
                  onClick={handleOk}
                  sx={{ color: 'background.paper' }}
                  disabled={
                    (!canSave && !curText.length) || !myChanged || recording
                  }
                >
                  <SendIcon />
                </Button>
              </span>
            </Tooltip>
          )}
        </div>
      </RowDiv>
    </ColumnDiv>
  );
};
