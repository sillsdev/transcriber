import React from 'react';
import { TextField } from '@mui/material';
import { TeamContext } from '../../../context/TeamContext';
import { IProjectDialogState } from './ProjectDialog';

export const ProjectDescription = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;
  const { description } = state;

  const handleChangeDescription = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, description: e.target?.value || '' }));
  };

  return (
    <TextField
      margin="dense"
      id="description"
      label={t.description}
      value={description}
      onChange={handleChangeDescription}
      fullWidth
    />
  );
};
