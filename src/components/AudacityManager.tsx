import React from 'react';
import { useGlobal } from 'reactn';
import { MediaFile, Passage, Section, Plan } from '../model';
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
  related,
  useAudacityProjUpdate,
  useAudacityProjRead,
  useAudacityProjDelete,
  usePlan,
} from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { API_CONFIG, isElectron } from '../api-variable';
import { debounce } from 'lodash';
import { RecordIdentity } from '@orbit/data';
import { launchAudacity, cleanFileName } from '../utils';

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

export interface ConfigureDialogProps {
  passageId: RecordIdentity;
  mediaId: string;
  open: boolean;
  onClose: () => void;
}

function AudacityManager(props: ConfigureDialogProps) {
  const classes = useStyles();
  const { passageId, mediaId, onClose, open } = props;
  const audUpdate = useAudacityProjUpdate();
  const audRead = useAudacityProjRead();
  const audDelete = useAudacityProjDelete();
  const [exists, setExists] = React.useState(false);
  const [name, setName] = React.useState('');
  const [memory] = useGlobal('memory');
  const [changed] = useGlobal('changed');
  const { showMessage } = useSnackBar();
  const { getPlan } = usePlan();

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

  const makeSlug = (rec: Plan | null) => {
    return (
      rec?.attributes?.slug ||
      cleanFileName(rec?.attributes?.name || '')
        .replace(' ', '')
        .slice(0, 6) + rec?.id.split('-')[0]
    );
  };

  const handleCreate = async () => {
    if ((passageId?.id || '') !== '') {
      const passRec = memory.cache.query((q) =>
        q.findRecord(passageId)
      ) as Passage;
      const secId = related(passRec, 'section');
      const secRec = memory.cache.query((q) =>
        q.findRecord({ type: 'section', id: secId })
      ) as Section;
      const planRec = getPlan(related(secRec, 'plan'));
      const docs = await ipc?.invoke('getPath', 'documents');
      const fullName = path.join(
        docs,
        'Audacity',
        makeSlug(planRec),
        passRec?.attributes?.book,
        cleanFileName(passRec?.attributes?.reference),
        `${makeSlug(planRec)}-${passRec?.attributes?.book}-${cleanFileName(
          passRec?.attributes?.reference
        )}.aup3`
      );
      setName(fullName);
      fs.mkdirSync(path.dirname(fullName), { recursive: true });
      fs.copyFileSync(path.join(API_CONFIG.resourcePath, 'new.aup3'), fullName);
      launchAudacity(fullName);
    }
  };

  const getMediaUrl = (mediaId: string) => {
    console.log(mediaId);
    let mediaUrl = '';
    if (mediaId !== '') {
      const mediaRec = memory.cache.query((q) =>
        q.findRecord({ type: 'mediafile', id: mediaId })
      ) as MediaFile;
      mediaUrl = mediaRec?.attributes?.audioUrl || '';
    }
    return mediaUrl;
  };

  const handleOpen = () => {
    if (changed) {
      showMessage('Save before editing');
      return;
    }
    launchAudacity(exists ? name : getMediaUrl(mediaId));
  };

  const handleImport = () => {};

  const handleUnlink = () => {
    audDelete(passageId.id);
    setName('');
  };

  const handleDelete = () => {
    const audRec = audRead(passageId.id);
    fs.unlinkSync(audRec?.attributes?.audacityName);
    audDelete(passageId.id);
    setName('');
  };

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
      <DialogTitle id="manager-title">Audacity Manager</DialogTitle>
      <Grid container className={classes.grid}>
        <Grid item xs={9}>
          <Grid container justify="center">
            <FormControl>
              <TextField
                id="audacity-project"
                autoFocus
                required
                label={'Audacity Project'}
                className={classes.name}
                value={name}
                onChange={handleAudacityName}
              />
            </FormControl>
          </Grid>
        </Grid>
        <Grid item xs={3}>
          {exists && name !== '' ? (
            <div className={classes.actions}>
              <Button onClick={handleOpen}>Open</Button>
              <Button onClick={handleImport}>Import</Button>
              <Button onClick={handleUnlink}>Unlink</Button>
              <Button onClick={handleDelete}>Delete</Button>
            </div>
          ) : (
            <div className={classes.actions}>
              <Button onClick={handleBrowse}>Browse</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          )}
        </Grid>
      </Grid>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AudacityManager;
