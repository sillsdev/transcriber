import React from 'react';
import { TextField } from '@mui/material';
import { IResourceState } from '.';
import { IResourceStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedResourceSelector } from '../../selector';

export const ResourceDescription = (props: IResourceState) => {
  const { state, setState } = props;
  const { description } = state;
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  const handleChangeDescription = (e: any) => {
    e.persist();
    setState &&
      setState((state) => ({ ...state, description: e.target?.value || '' }));
  };

  return (
    <TextField
      margin="dense"
      id="description"
      label={t.description}
      value={description}
      onChange={setState ? handleChangeDescription : undefined}
      fullWidth
    />
  );
};
