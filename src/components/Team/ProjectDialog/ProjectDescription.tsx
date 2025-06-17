import React from 'react';
import { TextField } from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';

export const ProjectDescription = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const t = useSelector(vProjectSelector, shallowEqual);
  const { description } = state;

  const handleChangeDescription = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, description: e.target?.value || '' }));
  };

  return (
    <TextField
      margin="dense"
      id="description"
      multiline
      variant="standard"
      label={t.description} // Should say Audio Project Description
      value={description}
      onChange={handleChangeDescription}
      sx={{ minWidth: '150px', flex: '1 1 calc(50% - 16px)' }}
      fullWidth
    />
  );
};
