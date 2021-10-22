import React from 'react';
import { useGlobal } from 'reactn';
import moment from 'moment';
import { connect } from 'react-redux';
import { IState, IAudacityManagerStrings, MediaFile } from '../../model';
import localStrings from '../../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  Grid,
  FormControl,
  TextField,
  Typography,
} from '@material-ui/core';
import {
  useAudacityProjUpdate,
  useAudacityProjRead,
  useAudacityProjDelete,
  useAudProjName,
} from '../../crud';
import { useSnackBar } from '../../hoc/SnackBar';
import { API_CONFIG, isElectron } from '../../api-variable';
import { debounce } from 'lodash';
import { RecordIdentity } from '@orbit/data';
import {
  launchAudacity,
  loadBlob,
  isProcessRunning,
  audPrefsName,
  setAudacityPref,
} from '../../utils';
import { dataPath, PathType } from '../../utils';
import { extensions, mimes } from '.';

const fs = require('fs');
const ipc = isElectron ? require('electron').ipcRenderer : null;
const path = require('path');

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    grid: {
      minWidth: '500px',
    },
    name: {
      minWidth: '400px',
      margin: theme.spacing(2),
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2),
      marginLeft: theme.spacing(1),
      '& .MuiButton-root': {
        marginBottom: theme.spacing(2),
      },
      // '& .MuiButton-label': {
      //   justifyContent: 'flex-end',
      // },
    },
    label: { margin: theme.spacing(2) },
  })
);

interface IStateProps {
  t: IAudacityManagerStrings;
}

export interface IProps extends IStateProps {
  item: number;
  passageId: RecordIdentity;
  mediaId: string;
  open: boolean;
  onClose: () => void;
  onImport: (i: number, list: File[]) => void;
}

function AudacityManager(props: IProps) {
  const classes = useStyles();
  const { passageId, mediaId, onClose, open, t } = props;
  const { item, onImport } = props;
  const audUpdate = useAudacityProjUpdate();
  const audRead = useAudacityProjRead();
  const audDelete = useAudacityProjDelete();
  const [reporter] = useGlobal('errorReporter');
  const [exists, setExists] = React.useState(false);
  const [name, setName] = React.useState('');
  const [memory] = useGlobal('memory');
  const [changed] = useGlobal('changed');
  const { showMessage } = useSnackBar();
  const getProjName = useAudProjName();

  const handleClose = () => {
    onClose();
  };

  const handleAudacityName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleBrowse = () => {
    ipc?.invoke('audacityOpen').then((fullName: string[]) => {
      if (fullName && fullName.length > 0) setName(fullName[0]);
    });
  };

  const getMediaUrl = (mediaId: string) => {
    let mediaUrl = '';
    if (mediaId !== '') {
      const mediaRec = memory.cache.query((q) =>
        q.findRecord({ type: 'mediafile', id: mediaId })
      ) as MediaFile;
      mediaUrl = mediaRec?.attributes?.audioUrl || '';
    }
    return mediaUrl;
  };

  const getMediaUpdated = (mediaId: string) => {
    let mediaUpdated = '';
    if (mediaId !== '') {
      const mediaRec = memory.cache.query((q) =>
        q.findRecord({ type: 'mediafile', id: mediaId })
      ) as MediaFile;
      mediaUpdated = mediaRec?.attributes?.dateUpdated || '';
    }
    return mediaUpdated;
  };

  const handleCreate = async () => {
    const prefsName = await audPrefsName();
    if (!prefsName) {
      showMessage(t.installError);
      return;
    }

    let mediaName = '';
    if ((mediaId || '') !== '') {
      const url = getMediaUrl(mediaId);
      mediaName = dataPath(url, PathType.MEDIA);
      if (!fs.existsSync(mediaName)) {
        showMessage(t.checkDownload);
        return;
      }
    }
    if ((passageId.id || '') !== '') {
      const fullName = await getProjName(passageId);
      const beforeContent = await setAudacityPref(fullName);
      // setAudacityPref creates the folders needed for the copy below
      if (!fs.existsSync(fullName)) {
        if (Boolean(mediaName)) {
          let ext = mediaName.split('.').pop() || 'mp3';
          const mp3FullName = fullName
            .replace('aup3', 'io')
            .replace('.aup3', `.${ext}`);
          if (!fs.existsSync(mp3FullName)) {
            showMessage(t.loadingAudio);
            fs.copyFileSync(mediaName, mp3FullName);
            const updated = new Date(getMediaUpdated(mediaId));
            fs.utimesSync(mp3FullName, updated, updated);
          }
        }
        fs.copyFileSync(
          path.join(API_CONFIG.resourcePath, 'new.aup3'),
          fullName
        );
      }
      setExists(true);
      setName(fullName);
      if (beforeContent && (await isProcessRunning('audacity'))) {
        showMessage(t.closeAudacity);
        return;
      }

      launchAudacity(fullName, reporter);
    }
  };

  const handleOpen = async () => {
    if (changed) {
      showMessage(t.saveFirst);
      return;
    }
    const prefsName = await audPrefsName();
    if (!prefsName) {
      showMessage(t.installError);
      return;
    }
    const beforeContent = await setAudacityPref(name);
    if (beforeContent && (await isProcessRunning('audacity'))) {
      showMessage(t.closeAudacity);
      return;
    }

    launchAudacity(name, reporter);
  };

  const handleImport = async () => {
    if (name.indexOf('.aup3') === -1) {
      showMessage(t.badProjName);
      return;
    }
    const audioFolder = path.dirname(name.replace('aup3', 'io'));
    const result = fs.readdirSync(audioFolder) as string[];
    let mp3FullName = '';
    let mime = '';
    let lastTime = 0;
    for (const audioName of result) {
      const ext = audioName.split('.').pop() || '';
      const extIdx = extensions.indexOf(ext);
      const fullName = path.join(audioFolder, audioName);
      const stat = fs.statSync(fullName);
      if (
        moment(stat.mtime).isAfter(moment(lastTime)) &&
        extensions.indexOf(ext) >= 0
      ) {
        lastTime = stat.mtime;
        mp3FullName = fullName;
        mime = mimes[extIdx];
      }
    }
    if (!Boolean(mp3FullName)) {
      showMessage(t.missingImport.replace('{0}', audioFolder));
      return;
    }
    if (moment(lastTime).toISOString() <= getMediaUpdated(mediaId)) {
      showMessage(t.exportFirst);
      return;
    }
    const mp3Name = mp3FullName.split(path.sep).pop();
    if (!mp3Name) {
      showMessage(t.badProjPath);
      return;
    }

    const prefsName = await audPrefsName();
    if (!prefsName) {
      showMessage(t.installError);
      return;
    }

    loadBlob(mp3FullName, (url, b) => {
      if (b) {
        onImport(item, [new File([b], mp3Name as string, { type: mime })]);
        onClose();
      } else showMessage(url);
    });
  };

  const handleUnlink = () => {
    audDelete(passageId.id);
    setName('');
  };

  // const handleDelete = () => {
  //   const audRec = audRead(passageId.id);
  //   fs.unlinkSync(audRec?.attributes?.audacityName);
  //   audDelete(passageId.id);
  //   setName('');
  // };

  const nameUpdate = debounce(() => {
    audUpdate(passageId.id, name);
  }, 100);

  React.useEffect(() => {
    if (name === '' && (passageId?.id || '') !== '') {
      const audRec = audRead(passageId.id);
      if (audRec?.attributes?.audacityName) {
        setName(audRec?.attributes?.audacityName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (name) {
      setExists(fs.existsSync(name));
      nameUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageId, name]);

  return (
    <Dialog onClose={handleClose} aria-labelledby="manager-title" open={open}>
      <DialogTitle id="manager-title">{t.title}</DialogTitle>
      <Grid container className={classes.grid}>
        {exists && name !== '' ? (
          <Grid container justifyContent="center">
            <Grid item xs={9}>
              <FormControl>
                <TextField
                  id="audacity-project"
                  autoFocus
                  required
                  label={t.audacityProject}
                  className={classes.name}
                  value={name}
                  onChange={handleAudacityName}
                  helperText={exists || name === '' ? null : t.missingProject}
                />
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <div className={classes.actions}>
                <Button onClick={handleOpen} variant="outlined">
                  {t.open}
                </Button>
                <Button onClick={handleImport} variant="outlined">
                  {t.import}
                </Button>
                <Button onClick={handleUnlink} variant="outlined">
                  {t.unlink}
                </Button>
                {/* <Button onClick={handleDelete}>Delete</Button> */}
              </div>
            </Grid>
          </Grid>
        ) : (
          <Grid container justifyContent="center">
            <Grid item xs={9}>
              <FormControl className={classes.label}>
                <Typography>{t.tip}</Typography>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <div className={classes.actions}>
                <Button onClick={handleCreate} variant="outlined">
                  {t.create}
                </Button>
                <Button onClick={handleBrowse} variant="outlined">
                  {t.browse}
                </Button>
              </div>
            </Grid>
          </Grid>
        )}
      </Grid>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="primary">
          {t.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'audacityManager' }),
});

export default connect(mapStateToProps)(AudacityManager) as any;
