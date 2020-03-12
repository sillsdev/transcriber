import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, ITranscriptionShowStrings } from '../model';
import localStrings from '../selector/localize';
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
} from '@material-ui/core';
import SnackBar from './SnackBar';
import { getMediaProjRec, getMediaRec } from '../utils';

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
  const { passageId, t, visible, closeMethod } = props;
  // const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [open, setOpen] = useState(visible);
  const [message, setMessage] = useState(<></>);
  const [transcription, setTranscription] = useState('');
  const [fontName, setFontName] = useState('');
  const [fontSize, setFontSize] = useState('');
  const [rtl, setRtl] = useState(false);

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
    if (passageId) {
      const mediaRec = getMediaRec(passageId, memory);
      const attr = mediaRec && mediaRec.attributes;
      setTranscription(attr && attr.transcription ? attr.transcription : '');
      const projRec = getMediaProjRec(mediaRec, memory);
      const projAttr = projRec && projRec.attributes;
      if (projAttr) {
        setFontName(projAttr.defaultFont ? projAttr.defaultFont : '');
        setFontSize(projAttr.defaultFontSize ? projAttr.defaultFontSize : '');
        setRtl(projAttr.rtl);
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [passageId]);

  const fontFamily = fontName
    ? fontName.split(',')[0].replace(/ /g, '')
    : 'CharisSIL';

  // See: https://github.com/typekit/webfontloader#custom
  const fontConfig = {
    custom: {
      families: [fontFamily],
      urls: ['https://fonts.siltranscriber.org/' + fontFamily + '.css'],
    },
  };

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
          <WebFontLoader config={fontConfig}>
            <TextField
              autoFocus
              margin="dense"
              variant="filled"
              multiline
              id="transcription"
              label={t.transcription}
              value={transcription}
              onChange={handleChange}
              style={{
                fontFamily,
                fontSize: fontSize ? fontSize : 'large',
                direction: rtl ? 'rtl' : 'ltr',
              }}
              fullWidth
            />
          </WebFontLoader>
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

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(TranscriptionShow) as any
) as any;
