import React from 'react';
import { TextField } from '@material-ui/core';
import { IAddProjectState } from './AddProject';

const t = {
  projectName: 'Project Name',
};

export const ProjectName = (props: IAddProjectState) => {
  const { state, setState } = props;
  const { name } = state;

  const handleChangeName = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, name: e.target?.value || '' }));
  };

  return (
    <TextField
      autoFocus
      margin="dense"
      id="name"
      label={t.projectName}
      value={name}
      onChange={handleChangeName}
      fullWidth
    />
  );
};
