import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import * as actions from '../store';
import Auth from '../auth/Auth';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
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
  const [name, setName] = useState('');
  const [filetype, setFiletype] = useState('mp3');
  const [originalBlob, setOriginalBlob] = useState<Blob>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [open, setOpen] = useState(visible);
  const [loading, setLoading] = useState(false);
  const [offline] = useGlobal('offline');
  const [memory] = useGlobal('memory');
  const [filechanged, setFilechanged] = useState(false);
  const acceptextension = ['mp3', 'm4a', 'wav', 'ogg', 'flac'];
  const acceptmime = [
    'audio/mpeg',
    'audio/x-m4a',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
  ];
  const classes = useStyles();

  useEffect(() => {
    if (mediaId) fetchMediaUrl(mediaId, memory, offline, auth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  function recordingReady(blob: Blob) {
    setAudioBlob(blob);
    setFilechanged(true);
  }
  const reset = () => {
    setName('');
    setFilechanged(false);
    setOriginalBlob(undefined);
  };
  const handleAddOrSave = () => {
    if (audioBlob) {
      var files = [
        new File([audioBlob], name, {
          type: acceptmime[acceptextension.findIndex((e) => e === filetype)],
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
  const handleChangeFiletype = (e: any) => {
    setFiletype(e.target.value);
  };
  const handleLoadAudio = () => {
    console.log('load audio');
    setLoading(true);
    fetch(mediaUrl).then(async (r) => {
      setOriginalBlob(await r.blob());
      setLoading(false);
    });
    const mediaRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'mediafile', id: mediaId })
    ) as MediaFile;
    setName(mediaRec.attributes.originalFile);
    var index = acceptmime.findIndex(
      (m) => m === mediaRec.attributes.contentType
    );
    if (index > -1) setFiletype(acceptextension[index]);
  };

  return (
    <Dialog
      className={classes.root}
      open={open}
      onClose={handleCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">{'Record!'}</DialogTitle>
      <DialogContent>
        <Button variant="contained" onClick={handleLoadAudio} disabled={!hasUrl}>
          {loading ? t.loading : t.loadfile}
        </Button>
        <WSAudioPlayer
          allowRecord={true}
          blob={originalBlob}
          recordingReady={recordingReady}
          setChanged={setFilechanged}
        />
        <TextField
          className={classes.formControl}
          id="filename"
          label={t.fileName}
          value={name}
          onChange={handleChangeFileName}
          fullWidth
          required={true}
        />
        <FormControl className={classes.formControl}>
          <InputLabel id="demo-simple-select-label" required={true}>
            {t.fileType}
          </InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={filetype}
            onChange={handleChangeFiletype}
          >
            {acceptextension.map((e) => (
              <MenuItem key={e} value={e}>{e}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
          disabled={(ready && !ready()) || name === ''} //|| !filechanged}
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
