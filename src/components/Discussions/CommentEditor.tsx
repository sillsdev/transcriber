import { Button, TextField } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import CancelIcon from '@material-ui/icons/CancelOutlined';
import MicIcon from '@material-ui/icons/MicOutlined';
import { useGlobal } from 'reactn';
import { useRemoteSave, waitForIt } from '../../utils';
import { PassageDetailContext } from '../../context/PassageDetailContext';

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
  })
);
interface IProps {
  comment: string;
  refresh: number;
  onOk: (comment: string) => void;
  onCancel: () => void;
  onRecord: () => void;
}

export const CommentEditor = (props: IProps) => {
  const { comment, refresh, onOk, onCancel, onRecord } = props;
  const { playing, mediaPlaying, setPlaying, setMediaPlaying } =
    useContext(PassageDetailContext).state;

  const classes = useStyles();
  const [changed, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [, saveCompleted] = useRemoteSave();
  const [curText, setCurText] = useState(comment);
  const [doRecord, setDoRecord] = useState(false);

  useEffect(() => {
    if (doRecord)
      try {
        waitForIt(
          'stop playing',
          () => !playing && !mediaPlaying,
          () => false,
          100
        ).then(() => {
          onRecord();
          setDoRecord(false);
        });
      } catch {
        //do it anyway...
        onRecord();
        setDoRecord(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doRecord, playing, mediaPlaying]);

  const handleTextChange = (e: any) => {
    setCurText(e.target.value);
    const change = e.target.value !== '';
    if (change !== changed) setChanged(change);
  };
  const handleOk = () => {
    onOk && onOk(curText);
    setChanged(false);
  };
  const handleCancel = () => {
    onCancel();
    setChanged(false);
  };
  const handleRecord = () => {
    setPlaying(false);
    setMediaPlaying(false);
    setDoRecord(true);
  };
  useEffect(() => {
    if (refresh > 0) setCurText('');
  }, [refresh]);

  useEffect(() => {
    if (doSave && curText !== '') {
      handleOk();
      saveCompleted('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave]);

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
      <div className={classes.row}>
        <Button id="record" onClick={handleRecord}>
          <MicIcon />
        </Button>
        <div>
          <Button id="cancel" onClick={handleCancel} className={classes.button}>
            <CancelIcon />
          </Button>
          <Button
            id="ok"
            onClick={handleOk}
            className={classes.button}
            disabled={!curText.length}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};
