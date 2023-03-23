import React from 'react';
import { TextField } from '@mui/material';
import { IResourceState } from '.';
import { IResourceStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedResourceSelector } from '../../selector';

export const ResourceTitle = (props: IResourceState) => {
  const { state, setState } = props;
  const { title } = state;
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  const handleChangeTitle = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, title: e.target?.value || '' }));
  };

  return (
    <TextField
      margin="dense"
      id="title"
      label={t.title}
      value={title}
      onChange={handleChangeTitle}
      fullWidth
    />
  );
};
