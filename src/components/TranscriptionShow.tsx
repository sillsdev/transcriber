import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, MediaFile, ITranscriptionShowStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
// import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import SnackBar from './SnackBar';
import { related } from '../utils/related';

// const useStyles = makeStyles((theme: Theme) =>
//   createStyles({})
// );

interface IStateProps {
  t: ITranscriptionShowStrings;
}

interface IRecordProps {
  mediafiles: Array<MediaFile>;
}

interface IProps extends IRecordProps, IStateProps {
  passageId: string;
  visible: boolean;
  closeMethod?: () => void;
}

function TranscriptionShow(props: IProps) {
  const { passageId, t, visible, closeMethod, mediafiles } = props;
  // const classes = useStyles();
  const [open, setOpen] = useState(visible);
  const [message, setMessage] = useState(<></>);
  const [transcription, setTranscription] = useState('');

  const handleChange = () => {};

  const handleClose = () => {
    if (closeMethod) {
      closeMethod();
    }
    setOpen(false);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    const media = mediafiles.filter(m => related(m, 'passage') === passageId);
    if (media.length > 0) {
      setTranscription(media[0].attributes.transcription);
    }
  }, [passageId, mediafiles]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{t.transcription}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.transcriptionDisplay}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            variant="filled"
            multiline
            id="transcription"
            label={t.transcription}
            value={transcription}
            onChange={handleChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="primary">
            {t.close}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcriptionShow' }),
});

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  TranscriptionShow
) as any) as any;
