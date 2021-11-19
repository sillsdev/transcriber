import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import Auth from '../auth/Auth';
//import lamejs from 'lamejs';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
  TextField,
  Theme,
} from '@material-ui/core';
import WSAudioPlayer from './WSAudioPlayer';
import { QueryBuilder } from '@orbit/data';
import { loadBlob, removeExtension } from '../utils';
import { MediaSt, useFetchMediaUrl } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import ArtifactType from './Workflow/SelectArtifactType';

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
      minWidth: 120,
    },
  })
);
interface IStateProps {
  t: IPassageRecordStrings;
}

interface IProps extends IStateProps {
  visible: boolean;
  mediaId: string;
  auth: Auth;
  multiple?: boolean;
  metaData?: JSX.Element;
  defaultFilename?: string;
  ready: () => boolean;
  uploadMethod?: (files: File[]) => void;
  cancelMethod?: () => void;
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
  const mimeTypeRef = useRef('audio/wav');
  const [artifactType, setArtifactType] = useState(''); //id
  const { showMessage } = useSnackBar();
  const extensions = useMemo(
    () => ['mp3', 'webm', 'mka', 'm4a', 'wav', 'ogg'],
    []
  );
  const mimes = useMemo(
    () => [
      'audio/mpeg',
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/x-m4a',
      'audio/wav',
      'audio/ogg;codecs=opus',
    ],
    []
  );
  const classes = useStyles();

  useEffect(() => {
    if (mediaId !== mediaState.urlMediaId) fetchMediaUrl({ id: mediaId, auth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    if (!userHasSetName) {
      if (defaultFilename) setName(defaultFilename);
      else setName(t.defaultFilename);
    }
  }, [userHasSetName, defaultFilename, t.defaultFilename]);

  const setMimeType = (mimeType: string) => {
    mimeTypeRef.current = mimeType;
    setExtension();
  };
  const setExtension = () => {
    if (mimeTypeRef.current) {
      var i = mimes.findIndex((m) => m === mimeTypeRef.current);
      setFiletype(extensions[i]);
    }
  };
  useEffect(() => {
    setExtension();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extensions, mimes]);

  function onBlobReady(blob: Blob) {
    setAudioBlob(blob);
    if (blob.type) {
      setMimeType(blob.type);
    }
    setFilechanged(true);
  }
  const reset = () => {
    setUserHasSetName(false);
    setFilechanged(false);
    setOriginalBlob(undefined);
  };
  const fileName = () => name; // + '.' + filetype;

  const handleAddOrSave = () => {
    if (audioBlob) {
      var files = [
        new File([audioBlob], fileName() + '.' + filetype, {
          type: mimeTypeRef.current,
        }),
      ];
      if (uploadMethod && files) {
        uploadMethod(files);
      }
    }
    reset();
    setOpen(false);
  };
  const handleCancel = () => {
    if (cancelMethod) {
      cancelMethod();
    }
    reset();
    setOpen(false);
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
    var index = mimes.findIndex((m) => m === mediaRec.attributes.contentType);
    if (index > -1) setFiletype(extensions[index]);
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
          setMimeType={setMimeType}
          onBlobReady={onBlobReady}
          setChanged={setFilechanged}
          setBlobReady={setBlobReady}
        />
        <TextField
          className={classes.formControl}
          id="filename"
          label={t.fileName}
          value={fileName()}
          onChange={handleChangeFileName}
          fullWidth
          required={true}
        />
        <ArtifactType
          onTypeChange={setArtifactType}
          allowNew={true} //check for admin
        />
        {metaData}
      </DialogContent>
      <DialogActions>
        <Button
          id="rec-cancel"
          className={classes.button}
          onClick={handleCancel}
          variant="outlined"
          color="primary"
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
            !blobReady || (ready && !ready()) || name === '' || !filechanged
          }
        >
          {t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageRecord' }),
});

export default connect(mapStateToProps)(PassageRecord) as any;
