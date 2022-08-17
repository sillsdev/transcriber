import React, { useEffect } from 'react';
import { ITag, IVProjectStrings } from '../../../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogProps,
  styled,
} from '@mui/material';
import { TeamContext } from '../../../context/TeamContext';
import {
  ProjectName,
  ProjectDescription,
  ProjectType,
  ProjectTags,
  ProjectExpansion,
  Language,
  ILanguage,
} from '.';
import Mode from '../../../model/dialogMode';
import { IDialog } from '../../../model';

const StyledDialog = styled(Dialog)<DialogProps>(() => ({
  '& .MuiDialog-paper': {
    maxWidth: '850px',
    minWidth: '535px',
  },
}));

const initState = {
  name: '',
  description: '',
  type: 'scripture',
  book: '',
  bcp47: 'und',
  languageName: '',
  isPublic: false,
  spellCheck: false,
  font: '',
  rtl: false,
  fontSize: 'large',
  tags: {} as ITag,
  flat: false,
  organizedBy: '',
  vProjectStrings: {} as IVProjectStrings,
};
export type IProjectDialog = typeof initState;

export interface IProjectDialogState {
  state: IProjectDialog;
  setState: React.Dispatch<React.SetStateAction<IProjectDialog>>;
}

interface IProps extends IDialog<IProjectDialog> {
  nameInUse?: (newName: string) => boolean;
}

export function ProjectDialog(props: IProps) {
  const { mode, values, isOpen, onOpen, onCommit, onCancel, nameInUse } = props;
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;
  initState.organizedBy = 'section';
  initState.vProjectStrings = t;
  const [state, setState] = React.useState({ ...initState });
  const { name, type, bcp47 } = state;

  useEffect(() => {
    setState(!values ? { ...initState } : { ...values });
  }, [values, isOpen]);

  const handleClose = () => {
    if (onOpen) onOpen(false);
    if (onCancel) onCancel();
  };

  const handleAdd = () => {
    if (onOpen) onOpen(false);
    onCommit(state);
  };

  const handleTypeChange = (val: string) => {
    setState((state) => ({ ...state, type: val || '' }));
  };

  const handleLanguageChange = (val: ILanguage) => {
    setState((state) => ({ ...state, ...val }));
  };

  return (
    <StyledDialog
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="projectDlg"
    >
      <DialogTitle id="projectDlg">
        {t.newProject.replace('{0}', mode === Mode.add ? t.configure : t.edit)}
      </DialogTitle>
      <DialogContent>
        <ProjectName state={state} setState={setState} inUse={nameInUse} />
        <ProjectDescription state={state} setState={setState} />
        <ProjectType type={type} onChange={handleTypeChange} />
        <Language {...state} onChange={handleLanguageChange} />
        <ProjectTags state={state} setState={setState} />
        <ProjectExpansion state={state} setState={setState} />
      </DialogContent>
      <DialogActions>
        <Button id="projCancel" onClick={handleClose} color="primary">
          {t.cancel}
        </Button>
        <Button
          id="projAdd"
          onClick={handleAdd}
          color="primary"
          disabled={
            (nameInUse && nameInUse(name)) ||
            name === '' ||
            bcp47 === 'und' ||
            type === ''
          }
        >
          {mode === Mode.add ? t.add : t.save}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default ProjectDialog;
