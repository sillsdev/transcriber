import React from 'react';
import { TextField } from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';

interface IProps extends IProjectDialogState {
  inUse?: (newName: string) => boolean;
}

export const ProjectName = (props: IProps) => {
  const { state, setState, inUse } = props;
  const { name } = state;
  const t = useSelector(vProjectSelector, shallowEqual);
  const [nameInUse, setInUse] = React.useState(false);

  const handleChangeName = (e: any) => {
    e.persist();
    const name = e.target?.value || '';
    setInUse((inUse && inUse(name)) === true);
    setState((state) => ({ ...state, name }));
  };

  return (
    <TextField
      autoFocus
      margin="dense"
      id="project-name"
      variant="standard"
      required
      label={t.projectName}
      value={name}
      helperText={nameInUse && t.nameInUse}
      onChange={handleChangeName}
      sx={{ minWidth: '150px', flex: '1 1 calc(50% - 16px)' }}
      fullWidth
    />
  );
};
