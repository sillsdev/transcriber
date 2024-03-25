import React from 'react';
import { TextField } from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';

export const ProjectDescription = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const t = useSelector(vProjectSelector, shallowEqual)
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
