import { Button, TextField, Tooltip } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import CancelIcon from '@material-ui/icons/CancelOutlined';
import MicIcon from '@material-ui/icons/MicOutlined';
import { waitForIt } from '../../utils';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import MediaRecord from '../MediaRecord';
import { ICommentEditorStrings, ISharedStrings, IState } from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { localStrings, sharedSelector } from '../../selector';
import { UnsavedContext } from '../../context/UnsavedContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      backgroudColor: theme.palette.primary.dark,
      display: 'flex',
      flexFlow: 'column',
      flexGrow: 1,
      '&:hover button': {
        color: 'black',
      },
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
    },
    button: {
      color: theme.palette.background.paper,
    },
    status: {
      marginRight: theme.spacing(2),
      alignSelf: 'center',
      color: theme.palette.primary.dark,
    },
  })
);
interface IStateProps {}
interface IProps extends IStateProps {
  toolId: string;
  comment: string;
  fileName: string;
  cancelOnlyIfChanged?: boolean;
  uploadMethod: (files: File[]) => Promise<void>;
  refresh: number;
  onOk: () => void;
  onCancel: () => void;
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
    mediaPlaying,
    setPlaying,
    setMediaPlaying,
    commentRecording,
    setCommentRecording,
  } = useContext(PassageDetailContext).state;
  const t: ICommentEditorStrings = useSelector(
    commentEditorSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const classes = useStyles();
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
    clearChanged,
    saveRequested,
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
    else if (changed) setStatusText(t.unsaved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, toolId]);

  useEffect(() => {
    if (startRecord)
      try {
        waitForIt(
          'stop playing',
          () => !playing && !mediaPlaying,
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
  }, [startRecord, playing, mediaPlaying]);

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
    onOk();
    setStatusText(t.saving);
    if (doRecordRef.current) setCommentRecording(false);
  };
  const handleCancel = () => {
    onCancel();
    reset();
  };

  const handleRecord = () => {
    setPlaying(false);
    setMediaPlaying(false);
    setStartRecord(true);
    setCommentRecording(true);
  };

  const reset = () => {
    if (doRecordRef.current) setCommentRecording(false);
    setStatusText('');
    setCurText('');
    doRecordRef.current = false;
    clearChanged(toolId);
  };

  useEffect(() => {
    if (refresh > 0) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return (
    <div className={classes.column}>
      <TextField
        autoFocus
        margin="dense"
        id="commenttext"
        value={curText}
        onChange={handleTextChange}
        fullWidth
        multiline
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
        />
      )}
      <div className={classes.row}>
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
          <Typography variant="caption" className={classes.status}>
            {statusText}
          </Typography>
          {(!cancelOnlyIfChanged || doRecordRef.current || myChanged) && (
            <Tooltip title={ts.cancel}>
              <span>
                <Button
                  id="cancel"
                  onClick={handleCancel}
                  className={classes.button}
                  disabled={recording}
                >
                  <CancelIcon />
                </Button>
              </span>
            </Tooltip>
          )}
          <Tooltip title={ts.save}>
            <span>
              <Button
                id="ok"
                onClick={handleOk}
                className={classes.button}
                disabled={
                  (!canSave && !curText.length) || !myChanged || recording
                }
              >
                <SendIcon />
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
