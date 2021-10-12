import React from 'react';
import { useGlobal } from 'reactn';
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
  launchAudacityExport,
  loadBlob,
  isProcessRunning,
  getMacroOutputMatch,
  setMacroOutputPath,
  audPrefsName,
  getAudPrefContent,
} from '../../utils';
import { dataPath, PathType } from '../../utils';

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
      setName(fullName[0]);
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

  const handleCreate = async () => {
    if (await isProcessRunning('audacity')) {
      showMessage(t.closeAudacity);
      return;
    }
    let url = '';
    if ((mediaId || '') !== '') {
      url = getMediaUrl(mediaId);
      const mediaName = dataPath(url, PathType.MEDIA);
      if (!fs.existsSync(mediaName)) {
        showMessage(t.checkDownload);
        url = '';
      }
    }
    if ((passageId.id || '') !== '') {
      const fullName = await getProjName(passageId);
      fs.mkdirSync(path.dirname(fullName), { recursive: true });
      if (!fs.existsSync(fullName))
        fs.copyFileSync(
          path.join(API_CONFIG.resourcePath, 'new.aup3'),
          fullName
        );
      setName(fullName);
      launchAudacity(fullName, reporter, url);
    }
  };

  const handleOpen = () => {
    if (changed) {
      showMessage(t.saveFirst);
      return;
    }
    launchAudacity(name, reporter);
  };

  const handleImport = async () => {
    if (await isProcessRunning('audacity')) {
      showMessage(t.closeAudacity);
      return;
    }
    if (name.indexOf('.aup3') === -1) {
      showMessage(t.badProjName);
      return;
    }
    const splitName = name.split(path.sep);
    let mp3Name = splitName.pop();
    if (!mp3Name) {
      showMessage(t.badProjPath);
      return;
    }
    mp3Name = mp3Name.replace('.aup3', '.mp3');
    const mp3FullName = splitName
      .concat('macro-output')
      .concat(mp3Name)
      .join(path.sep);
    fs.mkdirSync(path.dirname(mp3FullName), { recursive: true });
    const prefsName = await audPrefsName();
    if (!prefsName) {
      showMessage('Audacity Install Error');
      return;
    }
    const beforeContent = (await getAudPrefContent(prefsName)) || '';
    const m = getMacroOutputMatch(beforeContent);
    let oldMacroPath: string | undefined = undefined;
    if (m) {
      let folder = splitName.join(path.sep);
      if (path.sep === '\\') {
        folder = folder.replace(/\\/g, `${path.sep}${path.sep}`);
      }
      if (m[1] !== folder) {
        setMacroOutputPath(prefsName, beforeContent, m, folder);
        oldMacroPath = m[1];
      }
    }

    await launchAudacityExport(name, reporter, () => {
      loadBlob(mp3FullName, (url, b) => {
        if (b) {
          onImport(item, [
            new File([b], mp3Name as string, { type: 'audio/mp3' }),
          ]);
          onClose();
        } else showMessage(url);
      });
    });

    if (oldMacroPath) {
      const afterContent = (await getAudPrefContent(prefsName)) || '';
      const m = getMacroOutputMatch(afterContent);
      if (m) {
        setMacroOutputPath(prefsName, afterContent, m, oldMacroPath);
      }
    }
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
