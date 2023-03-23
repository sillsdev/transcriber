import React from 'react';
import { TextField } from '@mui/material';
import { IResourceState } from '.';

export const ResourceDescription = (props: IResourceState) => {
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
      label={'t.description'}
      value={description}
      onChange={handleChangeDescription}
      fullWidth
    />
  );
};
