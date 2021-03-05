import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, Passage, ITranscribeAddNoteStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {
      width: 300,
    },
    formControl: {
      margin: theme.spacing(3),
    },
    comment: {
      paddingTop: '16px',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
    },
  })
);

interface IStateProps {
  t: ITranscribeAddNoteStrings;
}

interface IProps extends IStateProps {
  passageIn: Passage;
  visible: boolean;
  editMethod?: (passageRec: Passage) => void;
  cancelMethod?: () => void;
}

function TranscribeAddNote(props: IProps) {
  const { t, visible, editMethod, cancelMethod, passageIn } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(visible);
  const [comment, setComment] = useState(passageIn?.attributes?.lastComment);
  const [inProcess, setInProcess] = useState(false);

  const handleSave = () => {
    doAddOrSave();
  };
  const handleCommentChange = (e: any) => setComment(e.target.value);
  const doAddOrSave = async () => {
    setInProcess(true);
    if (comment !== passageIn.attributes.lastComment) {
      let passage = {
        ...passageIn,
        attributes: {
          ...passageIn.attributes,
          lastComment: comment,
        },
      } as Passage;
      if (editMethod) {
        editMethod(passage);
      }
    }
    setOpen(false);
    setInProcess(false);
  };
  const handleCancel = () => {
    setComment('');
    if (cancelMethod) {
      cancelMethod();
    }
    setOpen(false);
  };

  useEffect(() => {
    setOpen(visible);
    setComment('');
  }, [visible]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{t.addNoteTitle}</DialogTitle>
        <DialogContent>
          <TextField
            variant="filled"
            multiline
            rowsMax={5}
            className={classes.comment}
            value={comment}
            onChange={handleCommentChange}
            style={{ overflow: 'auto', width: '400px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={comment === '' || inProcess}
          >
            {t.save}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcribeAddNote' }),
});

export default connect(mapStateToProps)(TranscribeAddNote) as any;
