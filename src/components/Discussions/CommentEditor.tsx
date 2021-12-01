import { Button, TextField } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { useGlobal } from 'reactn';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      backgroudColor: theme.palette.primary.dark,
      display: 'flex',
      '&:hover button': {
        color: 'black',
      },
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
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
  okStr: string;
  cancelStr: string;
  onOk: (comment: string) => void;
  onCancel: () => void;
}

export const CommentEditor = (props: IProps) => {
  const { comment, okStr, cancelStr, refresh, onOk, onCancel } = props;
  const classes = useStyles();
  const [changed, setChanged] = useGlobal('changed');
  const [curText, setCurText] = useState(comment);

  const handleTextChange = (e: any) => {
    setCurText(e.target.value);
    const change = e.target.value !== '';
    if (change !== changed) setChanged(change);
  };
  const handleOk = (e: any) => {
    onOk && onOk(curText);
  };
  const handleCancel = (e: any) => {
    onCancel && onCancel();
  };
  useEffect(() => {
    if (refresh > 0) setCurText('');
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
      <div className={classes.row}>
        <Button
          id="ok"
          onClick={handleOk}
          className={classes.button}
          disabled={!curText.length}
        >
          {okStr}
        </Button>
        <Button id="cancel" onClick={handleCancel} className={classes.button}>
          {cancelStr}
        </Button>
      </div>
    </div>
  );
};
