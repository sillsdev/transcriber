import React, { useState, useEffect } from 'react';
import { ITranscribeRejectStrings, ActivityStates, MediaFile } from '../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
} from '@mui/material';
import { commentProps } from '../control';
import { transcribeRejectSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  mediaIn: MediaFile;
  visible: boolean;
  editMethod?: (mediaRec: MediaFile, comment: string) => void;
  cancelMethod?: () => void;
}

function TranscribeReject(props: IProps) {
  const { visible, editMethod, cancelMethod, mediaIn } = props;
  const [open, setOpen] = useState(visible);
  const [next, setNext] = useState<ActivityStates>();
  const [comment, setComment] = useState('');
  const [inProcess, setInProcess] = useState(false);
  const t: ITranscribeRejectStrings = useSelector(
    transcribeRejectSelector,
    shallowEqual
  );

  const handleSave = () => {
    doAddOrSave();
  };
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNext((event.target as HTMLInputElement).value as ActivityStates);
  };
  const handleCommentChange = (e: any) => setComment(e.target.value);
  const doAddOrSave = async () => {
    setInProcess(true);
    if (next !== mediaIn.attributes.transcriptionstate || comment !== '') {
      let mediafile = {
        ...mediaIn,
        attributes: {
          ...mediaIn.attributes,
          transcriptionstate: next,
        },
      } as MediaFile;
      if (editMethod) {
        editMethod(mediafile, comment);
      }
    }
    setOpen(false);
    setInProcess(false);
  };
  const handleCancel = () => {
    if (cancelMethod) {
      cancelMethod();
    }
    setOpen(false);
  };

  useEffect(() => {
    setNext(
      mediaIn?.attributes?.transcriptionstate === ActivityStates.Transcribing
        ? ActivityStates.NeedsNewRecording
        : ActivityStates.NeedsNewTranscription
    );
    setComment('');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediaIn]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="transRejectDlg"
        disableEnforceFocus
      >
        <DialogTitle id="transRejectDlg">{t.rejectTitle}</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ m: 3 }}>
            <FormLabel component="legend">{t.rejectReason}</FormLabel>
            <RadioGroup
              aria-label={t.rejectReason}
              name={t.rejectReason}
              value={next}
              onChange={handleChange}
            >
              <FormControlLabel
                id="needsAudio"
                value={ActivityStates.NeedsNewRecording}
                control={<Radio color="primary" />}
                label={t.needsAudio}
              />
              <FormControlLabel
                id="needsCorrection"
                value={ActivityStates.NeedsNewTranscription}
                control={<Radio color="primary" />}
                label={t.needsCorrection}
              />
              <FormControlLabel
                id="incomplete"
                value={ActivityStates.Incomplete}
                control={<Radio color="primary" />}
                label={t.incomplete}
              />
            </RadioGroup>
          </FormControl>
          <TextField
            id="reject-comment"
            label={t.comment}
            variant="filled"
            multiline
            maxRows={5}
            sx={commentProps}
            value={comment}
            onChange={handleCommentChange}
          />
        </DialogContent>
        <DialogActions>
          <Button
            id="transcriberReject.cancel"
            onClick={handleCancel}
            variant="outlined"
            color="primary"
          >
            {t.cancel}
          </Button>
          <Button
            id="transcriberReject.save"
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={
              next === undefined ||
              next === mediaIn?.attributes?.transcriptionstate ||
              comment === '' ||
              inProcess
            }
          >
            {t.next}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default TranscribeReject;
