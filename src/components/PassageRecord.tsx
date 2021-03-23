import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import * as actions from '../store';
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
import { bindActionCreators } from 'redux';
import { QueryBuilder } from '@orbit/data';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      '& .MuiDialog-paper': {
        maxWidth: '90%',
        minWidth: '60%',
        minHeight: '80%',
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
  mediaUrl: string;
  hasUrl: boolean;
}

interface IDispatchProps {
  fetchMediaUrl: typeof actions.fetchMediaUrl;
}

interface IProps extends IStateProps, IDispatchProps {
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
  } = props;
  const { hasUrl, fetchMediaUrl, mediaUrl } = props;
  const [name, setName] = useState(t.defaultFilename);
  const [filetype, setFiletype] = useState('');
  const [originalBlob, setOriginalBlob] = useState<Blob>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [open, setOpen] = useState(visible);
  const [loading, setLoading] = useState(false);
  const [offline] = useGlobal('offline');
  const [memory] = useGlobal('memory');
  const [filechanged, setFilechanged] = useState(false);
  const [acceptedMimes, setAcceptedMimes] = useState<string[]>([]);
  const [acceptedExtension, setAcceptedExtensions] = useState<string[]>([]);
  const [mimeType, setMimeType] = useState('');
  const classes = useStyles();

  useEffect(() => {
    console.log('mediaId useEffect', mediaId);
    if (mediaId) fetchMediaUrl(mediaId, memory, offline, auth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    const acceptextension = ['webm', 'mka', 'mp3', 'm4a', 'wav', 'ogg'];
    const defaultacceptmime = [
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/mpeg;',
      'audio/x-m4a',
      'audio/wav',
      'audio/ogg;codecs=opus',
    ];
    var mimes: string[] = [];
    var extensions: string[] = [];
    for (var i in defaultacceptmime) {
      if (MediaRecorder.isTypeSupported(defaultacceptmime[i])) {
        mimes.push(defaultacceptmime[i]);
        extensions.push(acceptextension[i]);
      }
    }
    console.log(mimes, extensions);
    setAcceptedMimes(mimes);
    setAcceptedExtensions(extensions);
  }, []);
  useEffect(() => {
    var i = 0;
    if (mimeType) {
      i = acceptedMimes.findIndex((m) => m === mimeType);
    }
    setFiletype(acceptedExtension[i]);
  }, [acceptedExtension, acceptedMimes, mimeType]);

  function recordingReady(blob: Blob) {
    setAudioBlob(blob);
    setFilechanged(true);
  }
  const reset = () => {
    setName('');
    setFilechanged(false);
    setOriginalBlob(undefined);
  };
  const fileName = () => name + '.' + filetype; //TODO make this smarter

  const handleAddOrSave = () => {
    if (audioBlob) {
      var files = [
        new File([audioBlob], fileName(), {
          type:
            acceptedMimes[acceptedExtension.findIndex((e) => e === filetype)],
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
  };

  const handleLoadAudio = () => {
    console.log('load audio');
    setLoading(true);
    fetch(mediaUrl).then(async (r) => {
      var b = await r.blob();
      setOriginalBlob(b);
      setLoading(false);
      setAudioBlob(b);
    });
    const mediaRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'mediafile', id: mediaId })
    ) as MediaFile;
    setName(mediaRec.attributes.originalFile);
    var index = acceptedMimes.findIndex(
      (m) => m === mediaRec.attributes.contentType
    );
    if (index > -1) setFiletype(acceptedExtension[index]);
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
        {hasUrl && (
          <Button variant="contained" onClick={handleLoadAudio}>
            {loading ? t.loading : t.loadfile}
          </Button>
        )}
        <WSAudioPlayer
          allowRecord={true}
          blob={originalBlob}
          setMimeType={setMimeType}
          recordingReady={recordingReady}
          setChanged={setFilechanged}
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
          disabled={(ready && !ready()) || name === '' || !filechanged}
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
      fetchMediaUrl: actions.fetchMediaUrl,
    },
    dispatch
  ),
});
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageRecord' }),
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PassageRecord) as any;
