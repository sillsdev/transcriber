import React from 'react';
import { ITag } from '../../../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& .MuiDialog-paper': {
        maxWidth: '850px',
        minWidth: '535px',
      },
    },
  })
);

const t = {
  newProject: '{0} Project',
  new: 'New',
  edit: 'Edit',
  cancel: 'Cancel',
  add: 'Add',
  save: 'Save',
};

const initState = {
  name: '',
  description: '',
  type: 'scripture',
  bcp47: 'und',
  languageName: '',
  font: '',
  rtl: false,
  fontSize: 'large',
  tags: {} as ITag,
  layout: 'hierarchical',
  organizedBy: 'sections',
};

export type IProjectDialog = typeof initState;

export interface IProjectDialogState {
  state: IProjectDialog;
  setState: React.Dispatch<React.SetStateAction<IProjectDialog>>;
}

export function ProjectDialog(props: IDialog<IProjectDialog>) {
  const { mode, values, isOpen, onOpen, onCommit, onCancel } = props;
  const classes = useStyles();
  const [state, setState] = React.useState(
    mode === Mode.add || !values ? { ...initState } : { ...values }
  );
  const { name, type, bcp47 } = state;

  const handleClose = () => {
    setState({ ...initState });
    if (onOpen) onOpen(false);
    if (onCancel) onCancel();
  };

  const handleAdd = () => {
    console.log('Project added', state);
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
    <Dialog
      open={isOpen}
      className={classes.root}
      onClose={handleClose}
      aria-labelledby="add-project-dialog-title"
    >
      <DialogTitle id="add-project-dialog-title">
        {t.newProject.replace('{0}', mode === Mode.add ? t.new : t.edit)}
      </DialogTitle>
      <DialogContent>
        <ProjectName state={state} setState={setState} />
        <ProjectDescription state={state} setState={setState} />
        <ProjectType type={type} onChange={handleTypeChange} />
        <Language {...state} onChange={handleLanguageChange} />
        <ProjectTags state={state} setState={setState} />
        <ProjectExpansion state={state} setState={setState} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {t.cancel}
        </Button>
        <Button
          onClick={handleAdd}
          color="primary"
          disabled={name === '' || bcp47 === 'und' || type === ''}
        >
          {mode === Mode.add ? t.add : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProjectDialog;
