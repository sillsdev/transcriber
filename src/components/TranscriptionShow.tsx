import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import {
  MediaFile,
  ITranscriptionShowStrings,
  ProjectD,
  OrgWorkflowStep,
} from '../model';
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
import { getMediaProjRec } from '../crud/media';
import { FontData, getFontData, getArtTypeFontData } from '../crud/fontChoice';
import { useTranscription } from '../crud/useTranscription';
import { related } from '../crud/related';
import { findRecord } from '../crud/tryFindRecord';
import { ArtifactTypeSlug } from '../crud/artifactTypeSlug';
import { useSelector, shallowEqual } from 'react-redux';
import { transcriptionShowSelector } from '../selector';
import { useOrbitData } from '../hoc/useOrbitData';

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
  const workflowSteps = useOrbitData<OrgWorkflowStep[]>('orgworkflowstep');
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [org] = useGlobal('organization');
  const [projectId] = useGlobal('project');
  const [open, setOpen] = useState(visible);
  const { showMessage } = useSnackBar();
  const [transcription, setTranscription] = useState('');
  const [lang, setLang] = useState('');
  const [family, setFamily] = useState('');
  const [url, setUrl] = useState('');
  const [size, setSize] = useState('');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const getTranscription = useTranscription(true, undefined, version);
  const t: ITranscriptionShowStrings = useSelector(
    transcriptionShowSelector,
    shallowEqual
  );

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

  const setFontValues = (data: FontData) => {
    setLang(data.langTag);
    setFamily(data?.fontConfig?.custom?.families[0] || '');
    setUrl(data?.fontConfig?.custom?.urls[0] || '');
    setSize(data.fontSize);
    setDir(data.fontDir as 'ltr' | 'rtl');
  };

  useEffect(() => {
    if (id) {
      let mediaRec = isMediaId
        ? (memory?.cache.query((q) =>
            q.findRecord({ type: 'mediafile', id })
          ) as MediaFile)
        : null;
      setTranscription(
        getTranscription(related(mediaRec, 'passage') || id, exportId)
      );
      if (!exportId || exportId === ArtifactTypeSlug.Vernacular) {
        const projRec =
          getMediaProjRec(mediaRec, memory, reporter) ||
          (findRecord(memory, 'project', projectId) as ProjectD);
        if (projRec)
          getFontData(projRec, offline).then((data) => {
            setFontValues(data);
          });
      } else {
        const orgSteps = workflowSteps
          .filter((s) => related(s, 'organization') === org)
          .sort(
            (a, b) => a.attributes?.sequencenum - b.attributes?.sequencenum
          );
        const data = getArtTypeFontData(memory, exportId, orgSteps);
        setFontValues(data);
      }
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
            family={family}
            url={url}
            inputProps={{
              style: {
                fontFamily: family || 'charissil',
                direction: dir || 'ltr',
                fontSize: size || 'large',
              },
              readOnly: true,
            }}
            fullWidth
            lang={lang || 'en'}
            spellCheck={false}
          />
        </DialogContent>
        <DialogActions
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          {transcription === '' && <>{'\u00A0'}</>}
          {transcription !== '' && (
            <IconButton id="transCopy" onClick={handleCopy(transcription)}>
              <FaCopy />
            </IconButton>
          )}
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
