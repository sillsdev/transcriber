import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import { isElectron } from '../api-variable';
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
import { loadBlob } from '../utils';
import { MediaSt, useFetchMediaUrl } from '../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      '& .MuiDialog-paper': {
        maxWidth: '90%',
        minWidth: '60%',
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
  ready: () => boolean;
  uploadMethod?: (files: File[]) => void;
  multiple?: boolean;
  cancelMethod?: () => void;
  metaData?: JSX.Element;
}

function PassageRecord(props: IProps) {
  const {
    t,
    visible,
    mediaId,
    auth,
    uploadMethod,
    cancelMethod,
    ready,
    metaData,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const [isOffline] = useGlobal('offline');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [name, setName] = useState(t.defaultFilename);
  const [filetype, setFiletype] = useState('');
  const [originalBlob, setOriginalBlob] = useState<Blob>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [open, setOpen] = useState(visible);
  const [loading, setLoading] = useState(false);
  const [memory] = useGlobal('memory');
  const [filechanged, setFilechanged] = useState(false);
  const [blobReady, setBlobReady] = useState(true);
  const mimeTypeRef = useRef('audio/wav');

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
    setName(t.defaultFilename);
    setFilechanged(false);
    setOriginalBlob(undefined);
  };
  const fileName = () => name; // + '.' + filetype;
  const removeExtension = (filename: string) => {
    var x = filename.split('.');
    if (x.length > 1) x.pop();
    return x.join('.');
  };
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
    setName(removeExtension(e.target.value));
  };

  const handleLoadAudio = () => {
    setLoading(true);
    loadBlob(mediaState.url, !isElectron || !isOffline, (b) => {
      setOriginalBlob(b);
      setLoading(false);
      setAudioBlob(b);
    });
    const mediaRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'mediafile', id: mediaId })
    ) as MediaFile;
    setName(removeExtension(mediaRec.attributes.originalFile));
    var index = mimes.findIndex((m) => m === mediaRec.attributes.contentType);
    if (index > -1) setFiletype(extensions[index]);
  };

  return (
    <Dialog
      className={classes.root}
      open={open}
      onClose={handleCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">{t.title}</DialogTitle>
      <DialogContent>
        {mediaState.status === MediaSt.FETCHED &&
          mediaState.urlMediaId === mediaId && (
            <Button variant="contained" onClick={handleLoadAudio}>
              {loading ? t.loading : t.loadfile}
            </Button>
          )}
        <WSAudioPlayer
          allowRecord={true}
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
        {metaData}
      </DialogContent>
      <DialogActions>
        <Button
          className={classes.button}
          onClick={handleCancel}
          variant="outlined"
          color="primary"
        >
          {t.cancel}
        </Button>
        <Button
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
