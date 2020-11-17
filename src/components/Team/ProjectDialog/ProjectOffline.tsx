import React from 'react';
import { FormControlLabel, Checkbox } from '@material-ui/core';
// import { TeamContext } from '../../../context/TeamContext';
import { IProjectDialogState } from './ProjectDialog';

export const ProjectOffline = (props: IProjectDialogState) => {
  const { state, setState } = props;
  // const ctx = React.useContext(TeamContext);
  // const t = ctx.state.vProjectStrings;

  const handleChange = (e: any) => {
    e.persist();
    setState((state) => ({
      ...state,
      offlineAvailable: !state.offlineAvailable,
    }));
  };

  return (
    <FormControlLabel
      control={
        <Checkbox checked={state.offlineAvailable} onChange={handleChange} />
      }
      label={'Make Available Offline'}
    />
  );
};
