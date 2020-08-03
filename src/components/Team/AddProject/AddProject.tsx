import React from 'react';
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
  ITag,
  ProjectExpansion,
  Language,
  ILanguage,
} from '.';

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
  newProject: 'New Project',
  cancel: 'Cancel',
  add: 'Add',
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
  layout: 'hierarcical',
  organizedBy: 'sections',
};

export type IAddProject = typeof initState;

export interface IAddProjectState {
  state: IAddProject;
  setState: React.Dispatch<React.SetStateAction<IAddProject>>;
}

interface IProps {
  isOpen?: (val: boolean) => void;
}

export function AddProjectDialog(props: IProps) {
  const { isOpen } = props;
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState({ ...initState });
  const { name, type, bcp47 } = state;

  const handleClickOpen = (e: React.MouseEvent) => {
    setOpen(true);
    if (isOpen) isOpen(true);
    e.stopPropagation();
  };

  const handleClose = () => {
    setState({ ...initState });
    setOpen(false);
    if (isOpen) isOpen(false);
  };

  const handleAdd = () => {
    console.log('Project added', state);
    setOpen(false);
    if (isOpen) isOpen(false);
  };

  const handleTypeChange = (val: string) => {
    setState((state) => ({ ...state, type: val || '' }));
  };

  const handleLanguageChange = (val: ILanguage) => {
    setState((state) => ({ ...state, ...val }));
  };

  return (
    <div>
      <Button variant="contained" color="default" onClick={handleClickOpen}>
        {t.newProject}
      </Button>
      <Dialog
        open={open}
        className={classes.root}
        onClose={handleClose}
        aria-labelledby="add-project-dialog-title"
      >
        <DialogTitle id="add-project-dialog-title">{t.newProject}</DialogTitle>
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
            {t.add}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AddProjectDialog;
