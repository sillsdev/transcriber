import React from 'react';
import { TextField } from '@mui/material';
import { IResourceState } from '.';
import { IResourceStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedResourceSelector } from '../../selector';

export const ResourceTerms = (props: IResourceState) => {
  const { state, setState } = props;
  const { terms } = state;
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  const handleChange = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, terms: e.target?.value || '' }));
  };

  return (
    <TextField
      margin="dense"
      id="terms"
      label={t.terms}
      multiline
      value={terms}
      onChange={handleChange}
      fullWidth
    />
  );
};
