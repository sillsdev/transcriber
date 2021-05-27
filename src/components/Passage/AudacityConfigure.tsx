import React from 'react';
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
const fs = require('fs');

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    grid: {
      minWidth: '400px',
    },
    name: {
      minWidth: '300px',
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

  const handleClose = () => {
    onClose();
  };

  const handleAudacityName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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
          <FormControl>
            <TextField
              id="audacity-project"
              autoFocus
              required
              label={'Audacity Project'}
              className={classes.name}
              onChange={handleAudacityName}
            />
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          {exists && name !== '' ? (
            <div className={classes.actions}>
              <Button>Unlink</Button>
              <Button>Delete</Button>
            </div>
          ) : (
            <div className={classes.actions}>
              <Button>Browse</Button>
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
      <Button onClick={handleClickOpen}>Audacity Configure</Button>
      <ConfigureDialog open={open} onClose={handleClose} />
    </div>
  );
}

export default AudacityConfigure;
