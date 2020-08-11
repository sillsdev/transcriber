import React from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { Organization, IDialog, DialogMode } from '../../model';
import DeleteExpansion from '../DeleteExpansion';
import { TeamContext } from '../../context/TeamContext';

interface IProps extends IDialog<Organization> {
  onDelete?: (team: Organization) => void;
}

export function TeamDialog(props: IProps) {
  const { mode, values, isOpen, onOpen, onCommit, onDelete } = props;
  const [name, setName] = React.useState(values?.attributes?.name || '');
  const ctx = React.useContext(TeamContext);
  const { cardStrings } = ctx.state;
  const t = cardStrings;

  const handleClose = () => {
    setName('');
    onOpen && onOpen(false);
  };

  const handleCommit = () => {
    console.log('Team added:', name);
    const current =
      mode === DialogMode.edit && values
        ? { ...values }
        : ({ attributes: {} } as Organization);
    if (current.hasOwnProperty('relationships')) delete current?.relationships;
    const team = {
      ...current,
      attributes: { ...current.attributes, name },
    } as Organization;
    onCommit(team);
    onOpen && onOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setName(e.target.value);
  };

  const handleDelete = () => {
    console.log('Deleting team:', name);

    const team = { ...values, attributes: { name } } as Organization;
    onDelete && onDelete(team);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        {mode === DialogMode.add ? t.addTeam : t.teamSettings}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label={t.teamName}
          value={name}
          onChange={handleChange}
          fullWidth
        />
        {mode === DialogMode.edit && (
          <DeleteExpansion
            title={t.deleteTeam}
            explain={t.explainTeamDelete}
            handleDelete={handleDelete}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {t.cancel}
        </Button>
        <Button onClick={handleCommit} color="primary" disabled={name === ''}>
          {mode === DialogMode.add ? t.add : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TeamDialog;
