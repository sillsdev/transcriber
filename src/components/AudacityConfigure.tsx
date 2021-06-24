import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  Grid,
  FormControl,
  TextField,
} from '@material-ui/core';
import AudacityLogo from '../control/AudacityLogo';
// import { useSnackBar } from '../hoc/SnackBar';
import { isElectron } from '../api-variable';

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
  open: boolean;
  onClose: () => void;
}

function ConfigureDialog(props: ConfigureDialogProps) {
  const classes = useStyles();
  const { onClose, open } = props;
  const [exists, setExists] = React.useState(false);
  const [name, setName] = React.useState('');
  // const { showMessage } = useSnackBar();

  const handleClose = () => {
    onClose();
  };

  const handleAudacityName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleBrowse = () => {
    ipc?.invoke('audacityOpen').then((fullName: string[]) => {
      // showMessage(`${JSON.stringify(fullName)} selected`);
      setName(fullName[0]);
    });
  };

  React.useEffect(() => {
    if (name) {
      setExists(fs.existsSync(name));
    }
  }, [name]);

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
              <Button variant="contained" color="primary">
                Launch
              </Button>
            )}
          </Grid>
        </Grid>
        <Grid item xs={3}>
          {exists && name !== '' ? (
            <div className={classes.actions}>
              <Button>Unlink</Button>
              <Button>Delete</Button>
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

function AudacityConfigure() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className={classes.root}>
      <IconButton
        id="planActAud"
        onClick={handleClickOpen}
        title={'Audacity Edit'}
      >
        <AudacityLogo />
      </IconButton>
      <ConfigureDialog open={open} onClose={handleClose} />
    </div>
  );
}

export default AudacityConfigure;
