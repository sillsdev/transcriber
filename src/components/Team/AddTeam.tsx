import React from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';

const t = {
  addTeam: 'Add a Team',
  teamTask: 'Enter team name.',
  teamName: 'Team Name',
  cancel: 'Cancel',
  add: 'Add',
};

export function AddTeamDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setName('');
    setOpen(false);
  };

  const handleAdd = () => {
    console.log('Team added:', name);
    setOpen(false);
  };

  const handleChange = (e: any) => {
    setName(e.target.value);
  };

  return (
    <div>
      <Button variant="contained" color="default" onClick={handleClickOpen}>
        {t.addTeam}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{t.addTeam}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.teamTask}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label={t.teamName}
            onChange={handleChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {t.cancel}
          </Button>
          <Button onClick={handleAdd} color="primary" disabled={name === ''}>
            {t.add}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AddTeamDialog;
