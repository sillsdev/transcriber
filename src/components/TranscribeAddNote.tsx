import React, { useState, useEffect } from 'react';
import {
  Passage,
  ITranscribeAddNoteStrings,
  PassageStateChange,
} from '../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { transcribeAddNoteSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { commentProps } from '../control';

interface IProps {
  passageIn?: Passage;
  pscIn?: PassageStateChange;
  visible: boolean;
  addMethod?: (passageRec: Passage) => void;
  editMethod?: (psc: PassageStateChange) => void;
  cancelMethod?: () => void;
}

function TranscribeAddNote(props: IProps) {
  const { visible, addMethod, editMethod, cancelMethod, passageIn, pscIn } =
    props;
  const [open, setOpen] = useState(visible);
  const [comment, setComment] = useState('');
  const [inProcess, setInProcess] = useState(false);
  const t: ITranscribeAddNoteStrings = useSelector(
    transcribeAddNoteSelector,
    shallowEqual
  );

  const handleSave = () => {
    doAddOrSave();
  };
  const handleCommentChange = (e: any) => setComment(e.target.value);
  const doAddOrSave = async () => {
    setInProcess(true);

    if (pscIn) {
      pscIn.attributes.comments = comment;
      if (editMethod) editMethod(pscIn);
    } else if (comment !== '') {
      let passage = {
        ...passageIn,
        attributes: {
          ...passageIn?.attributes,
          lastComment: comment,
        },
      } as Passage;
      if (addMethod) {
        addMethod(passage);
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
    setComment(pscIn?.attributes.comments || '');
  }, [visible, pscIn]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="transAddDlg"
        disableEnforceFocus
      >
        <DialogTitle id="transAddDlg">{t.addNoteTitle}</DialogTitle>
        <DialogContent>
          <TextField
            id="transcriberNote.text"
            variant="filled"
            multiline
            maxRows={5}
            value={comment}
            onChange={handleCommentChange}
            sx={commentProps}
          />
        </DialogContent>
        <DialogActions>
          <Button
            id="transcriberNote.cancel"
            onClick={handleCancel}
            variant="outlined"
            color="primary"
          >
            {t.cancel}
          </Button>
          <Button
            id="transcriberNote.save"
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

export default TranscribeAddNote;
