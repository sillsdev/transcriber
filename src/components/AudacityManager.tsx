import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IAudacityManagerStrings, MediaFile } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  Grid,
  FormControl,
  TextField,
} from '@material-ui/core';
import {
  useAudacityProjUpdate,
  useAudacityProjRead,
  useAudacityProjDelete,
  useAudProjName,
} from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { API_CONFIG, isElectron } from '../api-variable';
import { debounce } from 'lodash';
import { RecordIdentity } from '@orbit/data';
import { launchAudacity, launchAudacityExport, loadBlob } from '../utils';

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
      '& .MuiButton-label': {
        justifyContent: 'flex-end',
      },
    },
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
    if ((passageId?.id || '') !== '') {
      const fullName = await getProjName(passageId);
      setName(fullName);
      fs.mkdirSync(path.dirname(fullName), { recursive: true });
      if (!fs.exists(fullName))
        fs.copyFileSync(
          path.join(API_CONFIG.resourcePath, 'new.aup3'),
          fullName
        );
      launchAudacity(fullName, getMediaUrl(mediaId));
    }
  };

  const handleOpen = () => {
    if (changed) {
      showMessage(t.saveFirst);
      return;
    }
    launchAudacity(name);
  };

  const handleImport = async () => {
    if (name.indexOf('.aup3') === -1) {
      showMessage(t.badProjName);
      return;
    }
    const mp3Name = name.replace('.aup3', '.mp3').split(path.sep).pop();
    if (!mp3Name) {
      showMessage(t.badProjPath);
      return;
    }
    const docs = await ipc?.invoke('getPath', 'documents');
    const mp3FullName = path.join(docs, 'Audacity', 'macro-output', mp3Name);
    await launchAudacityExport(name, () => {
      console.log(`exported ${mp3FullName}`);
      const unused = false;
      loadBlob(mp3FullName, unused, (b) => {
        onImport(item, [new File([b], mp3Name, { type: 'audio/mp3' })]);
      });
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
        <Grid item xs={9}>
          <Grid container justify="center">
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
        </Grid>
        <Grid item xs={3}>
          {exists && name !== '' ? (
            <div className={classes.actions}>
              <Button onClick={handleOpen}>{t.open}</Button>
              <Button onClick={handleImport}>{t.import}</Button>
              <Button onClick={handleUnlink}>{t.unlink}</Button>
              {/* <Button onClick={handleDelete}>Delete</Button> */}
            </div>
          ) : (
            <div className={classes.actions}>
              <Button onClick={handleBrowse}>{t.browse}</Button>
              <Button onClick={handleCreate}>{t.create}</Button>
            </div>
          )}
        </Grid>
      </Grid>
      <DialogActions>
        <Button onClick={handleClose}>{t.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'audacityManager' }),
});

export default connect(mapStateToProps)(AudacityManager) as any;
