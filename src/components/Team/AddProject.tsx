import React from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { LanguagePicker } from 'mui-language-picker';
import FontSize from '../FontSize';
import { SelectPlanType } from '../../control/selectPlanType';
import { TeamContext } from '../../context/TeamContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& .MuiDialog-paper': {
        maxWidth: '850px',
      },
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    sameLine: {
      display: 'flex',
    },
    languageField: {
      marginLeft: 0,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    sameCol: {
      flexDirection: 'column',
    },
    previewCol: {
      marginTop: theme.spacing(2),
    },
  })
);

const t = {
  newProject: 'New Project',
  addTask: 'Enter project information.',
  projectName: 'Project Name',
  description: 'Description',
  projectType: 'Type of Project',
  language: 'Language',
  rightToLeft: 'Right-to-Left',
  font: 'Font',
  fontSize: 'Font size',
  preview: 'Preview',
  cancel: 'Cancel',
  add: 'Add',
};

const lt = {
  font: 'Font',
  script: 'Script',
  language: 'Language',
  selectLanguage: 'Choose Language Details',
  findALanguage: 'Find a language by name, code, or country',
  codeExplained: 'Code Explained',
  subtags: 'Subtags',
  details: 'Details',
  languageOf: 'A Language of $1$2.',
  inScript: ' in the $1 script',
  select: 'Save',
  cancel: 'Cancel',
};

const initState = {
  name: '',
  description: '',
  type: '',
  bcp47: 'und',
  languageName: '',
  font: '',
  rtl: false,
  fontSize: 'large',
};

interface IProps {
  isOpen?: (val: boolean) => void;
}

export function AddProjectDialog(props: IProps) {
  const { isOpen } = props;
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const ctx = React.useContext(TeamContext);
  const { planTypes } = ctx.state;
  const [state, setState] = React.useState({ ...initState });
  const {
    name,
    description,
    type,
    bcp47,
    languageName,
    font,
    rtl,
    fontSize,
  } = state;
  const langEl = React.useRef<any>();

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

  const handleChangeName = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, name: e.target?.value || '' }));
  };

  const handleChangeDescription = (e: any) => {
    e.persist();
    setState((state) => ({ ...state, description: e.target?.value || '' }));
  };

  const handleTypeChange = (e: any) => {
    setState((state) => ({ ...state, type: e.target?.value || '' }));
  };

  const handleBcp47 = (bcp47: string) => {
    setState((state) => ({ ...state, bcp47 }));
  };

  const handleLanguage = (languageName: string) => {
    setState((state) => ({ ...state, languageName }));
  };

  const handleFont = (font: string) => {
    setState((state) => ({ ...state, font }));
  };

  const handleChangeRtl = () => {
    setState((state) => ({ ...state, rtl: !state.rtl }));
  };

  const handleFontSize = (fontSize: string) => {
    setState((state) => ({ ...state, fontSize: fontSize }));
  };

  const handleChangeFont = (e: any) => {
    if (langEl.current) langEl.current.click();
    e.stopPropagation();
  };

  const widthStyle: CSSProperties = { width: 400 };
  const previewStyle: CSSProperties = {
    fontSize: fontSize,
    fontFamily: font,
    width: 400,
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
          <DialogContentText>{t.addTask}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label={t.projectName}
            value={name}
            onChange={handleChangeName}
            fullWidth
          />
          <TextField
            margin="dense"
            id="description"
            label={t.description}
            value={description}
            onChange={handleChangeDescription}
            fullWidth
          />
          <SelectPlanType
            planType={type}
            planTypes={planTypes}
            handleTypeChange={handleTypeChange}
          />
          <FormLabel>{t.language}</FormLabel>
          <FormGroup className={classes.group}>
            <div className={classes.sameLine}>
              <FormControlLabel
                ref={langEl}
                className={classes.languageField}
                control={
                  <LanguagePicker
                    value={bcp47}
                    name={languageName}
                    font={font}
                    setCode={handleBcp47}
                    setName={handleLanguage}
                    setFont={handleFont}
                    t={lt}
                  />
                }
                label=""
              />
              <FormControlLabel
                className={classes.textField}
                control={
                  <Checkbox
                    id="checkbox-rtl"
                    checked={rtl}
                    onChange={handleChangeRtl}
                  />
                }
                label={t.rightToLeft}
              />
            </div>
            <div className={classes.sameLine}>
              <div className={classes.sameCol}>
                <FormControlLabel
                  control={
                    <TextField
                      id="default-font"
                      label={t.font}
                      className={classes.textField}
                      value={font}
                      onClick={handleChangeFont}
                      onKeyDown={handleChangeFont}
                      margin="normal"
                      style={widthStyle}
                      variant="filled"
                      required={false}
                    />
                  }
                  label=""
                />
                <br />
                <FormControlLabel
                  className={classes.textField}
                  control={
                    <FontSize
                      label={t.fontSize}
                      value={fontSize}
                      font={font}
                      setSize={handleFontSize}
                    />
                  }
                  label=""
                />
              </div>
              <div className={classes.previewCol}>
                <FormLabel>{t.preview}</FormLabel>
                <div style={previewStyle}>
                  The quick, brown fox jumped over the lazy dog.
                </div>
              </div>
            </div>
          </FormGroup>
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
