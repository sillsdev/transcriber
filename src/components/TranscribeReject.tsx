import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  IState,
  ITranscribeRejectStrings,
  ActivityStates,
  MediaFile,
} from '../model';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
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
  t: ITranscribeRejectStrings;
}

interface IProps extends IStateProps {
  mediaIn: MediaFile;
  visible: boolean;
  editMethod?: (mediaRec: MediaFile, comment: string) => void;
  cancelMethod?: () => void;
}

function TranscribeReject(props: IProps) {
  const { t, visible, editMethod, cancelMethod, mediaIn } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(visible);
  const [next, setNext] = useState<ActivityStates>();
  const [comment, setComment] = useState('');
  const [inProcess, setInProcess] = useState(false);

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
      >
        <DialogTitle id="transRejectDlg">{t.rejectTitle}</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" className={classes.formControl}>
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
            rowsMax={5}
            className={classes.comment}
            value={comment}
            onChange={handleCommentChange}
            style={{ overflow: 'auto', width: '400px' }}
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcribeReject' }),
});

export default connect(mapStateToProps)(TranscribeReject) as any;
