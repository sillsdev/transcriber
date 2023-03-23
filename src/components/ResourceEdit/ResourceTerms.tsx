import React from 'react';
import { TextField } from '@mui/material';
import { IResourceState } from '.';

export const ResourceTerms = (props: IResourceState) => {
  const { state, setState } = props;
  const { terms } = state;

  const handleChange = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, terms: e.target?.value || '' }));
  };

  return (
    <TextField
      margin="dense"
      id="terms"
      label={'t.terms'}
      multiline
      value={terms}
      onChange={handleChange}
      fullWidth
    />
  );
};
