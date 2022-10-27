import React from 'react';
import { TextField } from `@mui/material';
import { TeamContext } from '../../../context/TeamContext';
import { IProjectDialogState } from './ProjectDialog';

interface IProps extends IProjectDialogState {
  inUse?: (newName: string) => boolean;
}

export const ProjectName = (props: IProps) => {
  const { state, setState, inUse } = props;
  const { name } = state;
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;
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
      id="name"
      required
      label={t.projectName}
      value={name}
      helperText={nameInUse && t.nameInUse}
      onChange={handleChangeName}
      fullWidth
    />
  );
};
