import React from 'react';
import {
  TextField,
  Checkbox,
  FormLabel,
  FormGroup,
  FormControlLabel,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { LanguagePicker } from 'mui-language-picker';
import { TeamContext } from '../context/TeamContext';

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

export interface ILanguage {
  bcp47: string;
  languageName: string;
  font: string;
  spellCheck: boolean;
}

interface IProps extends ILanguage {
  onChange: (state: ILanguage) => void;
}

export const Language = (props: IProps) => {
  const classes = useStyles();
  const { bcp47, languageName, font, spellCheck, onChange } = props;
  const [state, setState] = React.useState<ILanguage>({
    bcp47,
    languageName,
    font,
    spellCheck,
  });
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;
  const lt = ctx.state.pickerStrings;
  const stateRef = React.useRef<ILanguage>();
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

  const handleSpellCheckChange = (e: any) => {
    setState((state) => ({ ...state, spellCheck: e.target.checked }));
  };

  const TAB = 9;
  const SHIFT = 16;
  const CTRL = 17;

  const handleChangeFont = (e: any) => {
    if (langEl.current && e.keyCode && ![TAB, SHIFT, CTRL].includes(e.keyCode))
      langEl.current.click();
    e.stopPropagation();
  };

  React.useEffect(() => {
    if (stateRef.current !== state) {
      onChange(state);
      stateRef.current = state;
    }
  }, [state, onChange]);

  const widthStyle: CSSProperties = { width: 400 };

  return (
    <div className={classes.root}>
      <FormLabel className={classes.label}>{t.language}</FormLabel>
      <FormGroup className={classes.group}>
        <FormControlLabel
          id="language-code"
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
              id="language-font"
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
        <FormControlLabel
          control={
            <Checkbox
              id="language-spellCheck"
              checked={spellCheck}
              onChange={handleSpellCheckChange}
              value="spellCheck"
            />
          }
          label={t.spellCheck}
        />
      </FormGroup>
    </div>
  );
};
