import React from 'react';
import { TextField } from '@material-ui/core';
import { IProjectDialogState } from './ProjectDialog';

const t = {
  description: 'Description',
};

export const ProjectDescription = (props: IProjectDialogState) => {
  const { state, setState } = props;
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
