import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, ITranscriptionShowStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import WebFontLoader from '@dr-kobros/react-webfont-loader';
import { withData } from '../mods/react-orbitjs';
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
  IconButton,
} from '@material-ui/core';
import { FaCopy } from 'react-icons/fa';
import SnackBar from './SnackBar';
import { getMediaProjRec, getMediaRec, FontData, getFontData } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  })
);

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
  const { passageId, t, visible, closeMethod } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [open, setOpen] = useState(visible);
  const [message, setMessage] = useState(<></>);
  const [transcription, setTranscription] = useState('');
  const [fontData, setFontData] = useState<FontData>();
  const [fontStatus, setFontStatus] = useState<string>();

  const loadStatus = (status: string) => {
    setFontStatus(status);
  };

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

  const handleCopy = (text: string) => () => {
    navigator.clipboard.writeText(text).catch((err) => {
      setMessage(<span>{t.cantCopy}</span>);
    });
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    if (passageId) {
      const mediaRec = getMediaRec(passageId, memory);
      const attr = mediaRec && mediaRec.attributes;
      setTranscription(attr && attr.transcription ? attr.transcription : '');
      const projRec = getMediaProjRec(mediaRec, memory);
      if (projRec) setFontData(getFontData(projRec, offline));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [passageId]);

  const textStyle = {
    fontFamily: fontData?.fontFamily || 'CharisSIL',
    fontSize: fontData?.fontSize || 'large',
    direction: fontData?.fontDir || 'ltr',
  } as React.CSSProperties;

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
          {fontData && fontStatus !== 'active' ? (
            <WebFontLoader config={fontData.fontConfig} onStatus={loadStatus}>
              <TextField
                autoFocus
                margin="dense"
                variant="filled"
                multiline
                id="transcription"
                label={t.transcription}
                value={transcription}
                onChange={handleChange}
                inputProps={{ style: textStyle }}
                fullWidth
              />
            </WebFontLoader>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              variant="filled"
              multiline
              id="transcription"
              label={t.transcription}
              value={transcription}
              onChange={handleChange}
              inputProps={{ style: textStyle }}
              fullWidth
            />
          )}
        </DialogContent>
        <DialogActions className={classes.actions}>
          <IconButton onClick={handleCopy(transcription)}>
            <FaCopy />
          </IconButton>
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

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(TranscriptionShow) as any
) as any;
