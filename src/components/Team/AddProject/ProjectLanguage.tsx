import React from 'react';
import {
  TextField,
  FormLabel,
  FormGroup,
  FormControlLabel,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { LanguagePicker } from 'mui-language-picker';
import { IAddProjectState } from './AddProject';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      paddingTop: theme.spacing(3),
    },
    label: {
      color: theme.palette.secondary.main,
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    languageField: {
      marginLeft: 0,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
  })
);

const t = {
  language: 'Language',
  font: 'Font',
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

export const ProjectLanguage = (props: IAddProjectState) => {
  const { state, setState } = props;
  const classes = useStyles();
  const { bcp47, languageName, font } = state;
  const langEl = React.useRef<any>();

  const handleBcp47 = (bcp47: string) => {
    setState((state) => ({ ...state, bcp47 }));
  };

  const handleLanguage = (languageName: string) => {
    setState((state) => ({ ...state, languageName }));
  };

  const handleFont = (font: string) => {
    setState((state) => ({ ...state, font }));
  };

  const handleChangeFont = (e: any) => {
    if (langEl.current) langEl.current.click();
    e.stopPropagation();
  };

  const widthStyle: CSSProperties = { width: 400 };

  return (
    <div className={classes.root}>
      <FormLabel className={classes.label}>{t.language}</FormLabel>
      <FormGroup className={classes.group}>
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
      </FormGroup>
    </div>
  );
};
