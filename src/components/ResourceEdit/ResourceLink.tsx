import React, { useEffect } from 'react';
import { TextField } from '@mui/material';
import { IResourceState } from '.';
import { IResourceStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedResourceSelector } from '../../selector';
import { isUrl } from '../../utils';

export const ResourceLink = (props: IResourceState) => {
  const { state, setState } = props;
  const { linkurl } = state;
  const [helperText, setHelperText] = React.useState('');
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

  useEffect(() => {
    if (linkurl && !isUrl(linkurl)) setHelperText(t.linkError);
    else setHelperText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkurl]);

  return (
    <TextField
      margin="dense"
      id="link"
      label={t.link}
      value={linkurl ?? ''}
      helperText={helperText}
      onChange={setState ? handleChangeLink : undefined}
      fullWidth
    />
  );
};
