import React from 'react';
import { useGlobal } from 'reactn';
import { MediaFile } from '../model';
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
} from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { isElectron } from '../api-variable';
import { debounce } from 'lodash';
import { RecordIdentity } from '@orbit/data';
import { launchAudacity } from '../utils';

const fs = require('fs');
const ipc = isElectron ? require('electron').ipcRenderer : null;

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

function AudacityConfigure(props: ConfigureDialogProps) {
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

  const handleLaunch = () => {
    if (changed) {
      showMessage('Save before editing');
      return;
    }
    console.log(mediaId);
    const mediaRec = memory.cache.query((q) =>
      q.findRecord({ type: 'mediafile', id: mediaId })
    ) as MediaFile;
    launchAudacity(mediaRec?.attributes?.audioUrl || '');
  };

  const handleUnlink = () => {
    audDelete(passageId.id);
  };

  const handleDelete = () => {
    const audRec = audRead(passageId.id);
    fs.unlinkSync(audRec?.attributes?.audacityName);
    audDelete(passageId.id);
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
    <Dialog onClose={handleClose} aria-labelledby="configure-title" open={open}>
      <DialogTitle id="configure-title">Audacity Configure</DialogTitle>
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
            {exists && (
              <Button
                onClick={handleLaunch}
                variant="contained"
                color="primary"
              >
                Launch
              </Button>
            )}
          </Grid>
        </Grid>
        <Grid item xs={3}>
          {exists && name !== '' ? (
            <div className={classes.actions}>
              <Button onClick={handleUnlink}>Unlink</Button>
              <Button onClick={handleDelete}>Delete</Button>
            </div>
          ) : (
            <div className={classes.actions}>
              <Button onClick={handleBrowse}>Browse</Button>
              <Button>Create</Button>
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

export default AudacityConfigure;
