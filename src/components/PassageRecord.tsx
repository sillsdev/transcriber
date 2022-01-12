import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import Auth from '../auth/Auth';
import * as actions from '../store';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import WSAudioPlayer from './WSAudioPlayer';
import { QueryBuilder } from '@orbit/data';
import { loadBlob, removeExtension } from '../utils';
import { MediaSt, useFetchMediaUrl } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { bindActionCreators } from 'redux';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      '& .MuiDialog-paper': {
        maxWidth: '90%',
        minWidth: '90%',
      },
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    formControl: {
      margin: theme.spacing(1),
    },
    row: {
      display: 'flex',
    },
    status: {
      marginRight: theme.spacing(2),
      alignSelf: 'center',
    },
  })
);
interface IDispatchProps {
  convertBlob: typeof actions.convertBlob;
  resetConvertBlob: typeof actions.resetConvertBlob;
}
interface IStateProps {
  t: IPassageRecordStrings;
  convert_status: string;
  convert_complete: boolean;
  convert_blob: Blob;
}

interface IProps extends IStateProps, IDispatchProps {
  visible: boolean;
  mediaId: string;
  auth: Auth;
  multiple?: boolean;
  metaData?: JSX.Element;
  defaultFilename?: string;
  ready: () => boolean;
  uploadMethod?: (files: File[]) => Promise<void>;
  cancelMethod?: () => void;
  allowWave?: boolean;
  showFilename?: boolean;
}

function PassageRecord(props: IProps) {
  const {
    t,
    visible,
    mediaId,
    auth,
    defaultFilename,
    uploadMethod,
    cancelMethod,
    ready,
    metaData,
    allowWave,
    showFilename,
    convert_status,
    convert_complete,
    convert_blob,
    convertBlob,
    resetConvertBlob,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [name, setName] = useState(t.defaultFilename);
  const [userHasSetName, setUserHasSetName] = useState(false);
  const [filetype, setFiletype] = useState('');
  const [originalBlob, setOriginalBlob] = useState<Blob>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [open, setOpen] = useState(visible);
  const [loading, setLoading] = useState(false);
  const [memory] = useGlobal('memory');
  const [filechanged, setFilechanged] = useState(false);
  const [blobReady, setBlobReady] = useState(true);
  const [mimeType, setMimeType] = useState('audio/ogg;codecs=opus');
  const { showMessage } = useSnackBar();
  const [converting, setConverting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const extensions = useMemo(
    () => ['mp3', 'mp3', 'webm', 'mka', 'm4a', 'wav', 'ogg'],
    []
  );
  const mimes = useMemo(
    () => [
      'audio/mpeg',
      'audio/mp3',
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/x-m4a',
      'audio/wav',
      'audio/ogg;codecs=opus',
    ],
    []
  );
  const classes = useStyles();
  const close = () => {
    reset();
    setOpen(false);
  };

  useEffect(() => {
    setConverting(false);
    setUploading(false);
    setStatusText('');
  }, []);

  useEffect(() => {
    if (mediaId !== mediaState.urlMediaId) fetchMediaUrl({ id: mediaId, auth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    setExtension(mimeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mimeType, extensions, mimes]);

  useEffect(() => {
    if (!userHasSetName) {
      if (defaultFilename) setName(defaultFilename);
      else setName(t.defaultFilename);
    }
  }, [userHasSetName, defaultFilename, t.defaultFilename]);

  useEffect(() => {
    if (convert_status) {
      var progress = parseInt(convert_status);
      if (isNaN(progress)) {
        showMessage(convert_status);
      } else {
        setStatusText(t.compressing.replace('{0}', progress.toString()));
      }
    }
    if (convert_complete) {
      if (convert_blob)
        doUpload(convert_blob).then(() => {
          resetConvertBlob();
          setConverting(false);
          close();
        });
      else {
        setConverting(false);
        close();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convert_status, convert_complete, convert_blob]);

  const setExtension = (mimeType: string) => {
    if (mimeType) {
      var i = mimes.findIndex((m) => m === mimeType);
      if (i >= 0) setFiletype(extensions[i]);
    }
  };

  function onBlobReady(blob: Blob) {
    setAudioBlob(blob);
    setFilechanged(true);
  }
  const reset = () => {
    setMimeType('audio/ogg;codecs=opus');
    setUserHasSetName(false);
    setFilechanged(false);
    setOriginalBlob(undefined);
  };
  const fileName = () => name; // + '.' + filetype;

  const handleChangeMime = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMimeType((event.target as HTMLInputElement).value);
  };

  const doUpload = async (blob: Blob) => {
    setUploading(true);
    setStatusText(t.saving);
    var files = [
      new File([blob], fileName() + '.' + filetype, {
        type: mimeType,
      }),
    ];
    if (uploadMethod && files) {
      await uploadMethod(files);
    }
    setUploading(false);
  };
  const handleAddOrSave = () => {
    if (audioBlob) {
      if (mimeType !== 'audio/wav') {
        setConverting(true);
        convertBlob(audioBlob, mimeType);
      } else {
        doUpload(audioBlob).then(() => close());
      }
      return;
    }
    close();
  };
  const handleCancel = () => {
    if (cancelMethod) {
      cancelMethod();
    }
    close();
  };
  const handleChangeFileName = (e: any) => {
    e.persist();
    setName(e.target.value);
    setUserHasSetName(true);
  };

  const handleLoadAudio = () => {
    setLoading(true);
    reset();
    loadBlob(mediaState.url, (urlorError, b) => {
      if (b) {
        setOriginalBlob(b);
        setLoading(false);
        setAudioBlob(b);
      } else {
        showMessage(urlorError);
        //force it to go get another (unexpired) s3 url
        fetchMediaUrl({ id: mediaId, auth });
      }
    });
    const mediaRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'mediafile', id: mediaId })
    ) as MediaFile;
    setName(removeExtension(mediaRec.attributes.originalFile).name);
  };

  return (
    <Dialog
      className={classes.root}
      open={open}
      onClose={handleCancel}
      aria-labelledby="recDlg"
    >
      <DialogTitle id="recDlg">{t.title}</DialogTitle>
      <DialogContent>
        {mediaState.status === MediaSt.FETCHED &&
          mediaState.urlMediaId === mediaId && (
            <Button id="rec-load" variant="contained" onClick={handleLoadAudio}>
              {loading ? t.loading : t.loadfile}
            </Button>
          )}
        <WSAudioPlayer
          allowRecord={true}
          size={350}
          blob={originalBlob}
          onBlobReady={onBlobReady}
          setChanged={setFilechanged}
          setBlobReady={setBlobReady}
        />
        <div className={classes.row}>
          {showFilename && (
            <TextField
              className={classes.formControl}
              id="filename"
              label={t.fileName}
              value={fileName()}
              onChange={handleChangeFileName}
              required={true}
            />
          )}
          {allowWave && (
            <FormControl component="fieldset" className={classes.formControl}>
              <RadioGroup
                row={true}
                id="filetype"
                aria-label="filetype"
                name="filetype"
                value={mimeType}
                onChange={handleChangeMime}
              >
                <FormControlLabel
                  id="compressed"
                  value={'audio/ogg;codecs=opus'}
                  control={<Radio />}
                  label={t.compressed}
                />
                <FormControlLabel
                  id="uncompressed"
                  value={'audio/wav'}
                  control={<Radio />}
                  label={t.uncompressed}
                />
              </RadioGroup>
            </FormControl>
          )}
        </div>
        {metaData}
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" display="block" gutterBottom>
          {statusText}
        </Typography>
        <Button
          id="rec-cancel"
          className={classes.button}
          onClick={handleCancel}
          variant="outlined"
          color="primary"
          disabled={converting || uploading}
        >
          {t.cancel}
        </Button>
        <Button
          id="rec-save"
          className={classes.button}
          onClick={handleAddOrSave}
          variant="contained"
          color="primary"
          disabled={
            !blobReady ||
            (ready && !ready()) ||
            name === '' ||
            !filechanged ||
            converting ||
            uploading
          }
        >
          {t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      convertBlob: actions.convertBlob,
      resetConvertBlob: actions.resetConvertBlob,
    },
    dispatch
  ),
});
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageRecord' }),
  convert_status: state.convertBlob.statusmsg,
  convert_complete: state.convertBlob.complete,
  convert_blob: state.convertBlob.blob,
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PassageRecord) as any;
