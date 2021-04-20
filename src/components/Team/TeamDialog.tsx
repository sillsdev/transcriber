import React, { useEffect } from 'react';
import { useGlobal } from 'reactn';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
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
import { useTeamApiPull } from '../../crud';

interface IRecordProps {
  organizations: Array<Organization>;
}

interface IProps extends IRecordProps, IDialog<Organization> {
  onDelete?: (team: Organization) => void;
}

export function TeamDialog(props: IProps) {
  const {
    mode,
    values,
    isOpen,
    organizations,
    onOpen,
    onCommit,
    onDelete,
  } = props;
  const [name, setName] = React.useState('');
  const ctx = React.useContext(TeamContext);
  const { cardStrings } = ctx.state;
  const t = cardStrings;
  const teamApiPull = useTeamApiPull();
  const [offlineOnly] = useGlobal('offlineOnly');

  const handleClose = () => {
    onOpen && onOpen(false);
  };

  const handleCommit = async () => {
    const current =
      mode === DialogMode.edit && values
        ? values
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
    const team = { ...values, attributes: { name } } as Organization;
    onDelete && onDelete(team);
  };

  const nameInUse = (newName: string): boolean => {
    const sameNameRec = organizations.filter(
      (o) => o?.attributes?.name === newName
    );
    return sameNameRec.length > 0;
  };

  useEffect(() => {
    if (!name) {
      setName(values?.attributes?.name || '');
      if (!offlineOnly && values) teamApiPull(values.id);
    } else if (!isOpen) {
      setName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, isOpen]);

  return (
    <Dialog
      id="teamDialog"
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="teamDlg"
    >
      <DialogTitle id="teamDlg">
        {mode === DialogMode.add ? t.addTeam : t.teamSettings}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="teamName"
          label={t.teamName}
          value={name}
          helperText={nameInUse(name) && t.nameInUse}
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
        <Button id="teamCancel" onClick={handleClose} color="primary">
          {t.cancel}
        </Button>
        <Button
          id="teamCommit"
          onClick={handleCommit}
          color="primary"
          disabled={name === '' || nameInUse(name)}
        >
          {mode === DialogMode.add ? t.add : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
};

export default withData(mapRecordsToProps)(TeamDialog) as any;
