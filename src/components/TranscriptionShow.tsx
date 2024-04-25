import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { MediaFile, ITranscriptionShowStrings, ProjectD } from '../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { StyledTextField } from '../control/WebFontStyles';
import { FaCopy } from 'react-icons/fa';
import { useSnackBar } from '../hoc/SnackBar';
import {
  getMediaProjRec,
  FontData,
  getFontData,
  useTranscription,
  related,
  findRecord,
} from '../crud';
import { useSelector, shallowEqual } from 'react-redux';
import { transcriptionShowSelector } from '../selector';

interface IProps {
  id: string;
  isMediaId?: boolean;
  visible: boolean;
  closeMethod?: () => void;
  exportId?: string | null;
  version?: number;
}

function TranscriptionShow(props: IProps) {
  const [reporter] = useGlobal('errorReporter');
  const { id, isMediaId, visible, closeMethod, exportId, version } = props;
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [projectId] = useGlobal('project');
  const [open, setOpen] = useState(visible);
  const { showMessage } = useSnackBar();
  const [transcription, setTranscription] = useState('');
  const [fontData, setFontData] = useState<FontData>();
  const [textStyle, setTextStyle] = useState<React.CSSProperties>({});
  const getTranscription = useTranscription(true, undefined, version);
  const t: ITranscriptionShowStrings = useSelector(
    transcriptionShowSelector,
    shallowEqual
  );
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
        ? (memory.cache.query((q) =>
            q.findRecord({ type: 'mediafile', id })
          ) as MediaFile)
        : null;
      setTranscription(
        getTranscription(related(mediaRec, 'passage') || id, exportId)
      );
      const projRec =
        getMediaProjRec(mediaRec, memory, reporter) ||
        (findRecord(memory, 'project', projectId) as ProjectD);
      if (projRec)
        getFontData(projRec, offline).then((data) => {
          setFontData(data);
          setTextStyle({
            fontFamily: data.fontFamily,
            fontSize: data.fontSize,
            direction: data.fontDir as 'ltr' | 'rtl',
          });
        });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id, isMediaId, exportId]);

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
          <StyledTextField
            autoFocus
            margin="dense"
            variant="filled"
            multiline
            id="transcription"
            label={t.transcription}
            value={transcription}
            config={fontData?.fontConfig}
            onChange={handleChange}
            inputProps={{ style: textStyle }}
            fullWidth
            lang={fontData?.langTag || 'en'}
            spellCheck={false}
          />
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

export default TranscriptionShow;
