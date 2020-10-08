import React from 'react';
import { TextField } from '@material-ui/core';
import { TeamContext } from '../../../context/TeamContext';
import { IProjectDialogState } from './ProjectDialog';

export const ProjectName = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const { name } = state;
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;

  const handleChangeName = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, name: e.target?.value || '' }));
  };

  return (
    <TextField
      autoFocus
      margin="dense"
      id="name"
      required
      label={t.projectName}
      value={name}
      onChange={handleChangeName}
      fullWidth
    />
  );
};
