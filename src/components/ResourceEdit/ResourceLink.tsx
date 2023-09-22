import React from 'react';
import { TextField } from '@mui/material';
import { IResourceState } from '.';
import { IResourceStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedResourceSelector } from '../../selector';

export const ResourceLink = (props: IResourceState) => {
  const { state, setState } = props;
  const { linkurl } = state;
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  const handleChangeLink = (e: any) => {
    e.persist();
    setState &&
      setState((state) => ({
        ...state,
        linkurl: e.target?.value || '',
        changed: true,
      }));
  };

  return (
    <TextField
      required
      margin="dense"
      id="link"
      label={t.link}
      value={linkurl}
      onChange={setState ? handleChangeLink : undefined}
      fullWidth
    />
  );
};
