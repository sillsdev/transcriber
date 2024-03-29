import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, ITranscriptionShowStrings } from '../model';
import localStrings from '../selector/localize';
import WebFontLoader from '@dr-kobros/react-webfont-loader';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { FaCopy } from 'react-icons/fa';
import { useSnackBar } from '../hoc/SnackBar';
import {
  getMediaProjRec,
  FontData,
  getFontData,
  useTranscription,
  related,
} from '../crud';

interface IStateProps {
  t: ITranscriptionShowStrings;
}

interface IRecordProps {
  mediafiles: Array<MediaFile>;
}

interface IProps extends IRecordProps, IStateProps {
  id: string;
  isMediaId?: boolean;
  visible: boolean;
  closeMethod?: () => void;
  exportId?: string | null;
  version?: number;
}

function TranscriptionShow(props: IProps) {
  const [reporter] = useGlobal('errorReporter');
  const { id, isMediaId, t, visible, closeMethod, exportId, version } = props;
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [open, setOpen] = useState(visible);
  const { showMessage } = useSnackBar();
  const [transcription, setTranscription] = useState('');
  const [fontData, setFontData] = useState<FontData>();
  const [fontStatus, setFontStatus] = useState<string>();
  const getTranscription = useTranscription(true, undefined, version);
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

  const handleCopy = (text: string) => () => {
    navigator.clipboard.writeText(text).catch((err) => {
      showMessage(t.cantCopy);
    });
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    if (id) {
      let mediaRec = isMediaId
        ? (memory.cache.query((q: QueryBuilder) =>
            q.findRecord({ type: 'mediafile', id })
          ) as MediaFile)
        : null;
      setTranscription(
        getTranscription(related(mediaRec, 'passage') || id, exportId)
      );
      const projRec = getMediaProjRec(mediaRec, memory, reporter);
      if (projRec)
        getFontData(projRec, offline).then((data) => setFontData(data));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id, isMediaId, exportId]);

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
        aria-labelledby="transShowDlg"
        disableEnforceFocus
      >
        <DialogTitle id="transShowDlg">{t.transcription}</DialogTitle>
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
                lang={fontData?.langTag || 'en'}
                spellCheck={false}
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
              lang={fontData?.langTag || 'en'}
              spellCheck={false}
            />
          )}
        </DialogContent>
        <DialogActions
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <IconButton id="transCopy" onClick={handleCopy(transcription)}>
            <FaCopy />
          </IconButton>
          <Button
            id="transClose"
            onClick={handleClose}
            variant="contained"
            color="primary"
          >
            {t.close}
          </Button>
        </DialogActions>
      </Dialog>
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
