import React from 'react';
import { connect } from 'react-redux';
import { IState, ILanguagePickerStrings } from '../../model';
import localStrings from '../../selector/localize';
import { LangTag } from './langPicker/types';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import { woBadChar } from './util';
import LanguageChoice from './LanguageChoice';
import './LanguagePicker.css';
import clsx from 'clsx';
import { hasExact, getExact } from './index/LgExact';
import { hasPartial, getPartial } from './index/LgPartial';
import { hasNoSubTag, getNoSubTag } from './index/LgNoSubTag';
import { getScripts } from './index/LgScripts';
import { scriptName } from './index/LgScriptName';
import { fontMap } from './index/LgFontMap';
import jsonData from './data/langtags.json';

let langTags = jsonData as LangTag[];
langTags.push({
  full: 'qaa',
  iso639_3: 'qaa',
  localname: 'Unknown',
  name: 'Unknown',
  regionname: 'anywhere',
  script: 'Latn',
  sldr: false,
  tag: 'qaa',
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    check: {
      justifyContent: 'flex-end',
    },
    label: {
      flexDirection: 'row-reverse',
    },
    label2: {
      flexDirection: 'row-reverse',
      marginRight: 0,
    },
    textField: {
      width: 150,
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    fontField: {
      width: 300,
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    menu: {
      width: 200,
    },
    hide: {
      display: 'none',
    },
    grow: {
      flexGrow: 1,
    },
  })
);

interface IStateProps {
  t: ILanguagePickerStrings;
}

interface IProps extends IStateProps {
  value: string;
  name: string;
  font: string;
  setCode?: (code: string) => void;
  setName?: (name: string) => void;
  setFont?: (font: string) => void;
  disabled?: boolean;
}

export const LanguagePicker = (props: IProps) => {
  const { disabled } = props;
  const { value, name, font, setCode, setName, setFont, t } = props;
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [curValue, setCurValue] = React.useState(value);
  const [curName, setCurName] = React.useState(name);
  const [curFont, setCurFont] = React.useState(font);
  const [secondary, setSecondary] = React.useState(true);
  const [subtag, setSubtag] = React.useState(false);
  const [response, setResponse] = React.useState('');
  const [tag, setTag] = React.useState<LangTag>();
  const [defaultScript, setDefaultScript] = React.useState('');
  const [defaultFont, setDefaultFont] = React.useState('');
  const [fontOpts, setFontOpts] = React.useState(Array<string>());
  const langEl = React.useRef<any>();

  const ExtStr = '-x-';

  const handleClickOpen = (e: any) => {
    if (e.keyCode && e.keyCode === 9) return;
    let key = curValue.toLocaleLowerCase();
    const ext = key.indexOf(ExtStr);
    if (ext !== -1) key = key.slice(0, ext);
    if (hasExact(key) && key !== 'und') {
      setResponse(curName + ' (' + curValue + ')');
      const langTag = langTags[getExact(key)[0]];
      setTag(langTag);
      selectFont(langTag);
      setDefaultScript(langTag.script);
      setDefaultFont(curFont);
    } else {
      handleClear();
    }
    setOpen(true);
  };
  const handleClear = () => {
    setFontOpts([]);
    setResponse('');
    setTag(undefined);
    setDefaultFont('');
    if (langEl.current) langEl.current.click();
  };
  const handleCancel = () => {
    setCurValue(value);
    setCurName(name);
    setCurFont(font);
    setOpen(false);
  };

  const displayTag = (tag: LangTag) => {
    if (tag && tag.name) {
      setResponse(tag.name + ' (' + tag.tag + ')');
      setCurValue(tag.tag);
      setCurName(tag.name);
    }
  };

  const handleSelect = () => {
    if (setCode) setCode(curValue);
    if (setName) setName(curName);
    if (setFont) setFont(curFont);
    if (tag) {
      displayTag(tag);
    } else {
      setResponse('');
    }
    setOpen(false);
  };

  const handleChange = (e: any) => {
    setResponse(e.target.value);
  };

  const addFontInfo = (e: any) => {
    setDefaultFont(e.target.value);
    setCurFont(e.target.value);
  };

  const safeFonts = [
    { value: 'Noto Sans', label: 'Noto Sans (Recommended)', rtl: false },
    { value: 'Annapurna SIL', label: 'Annapurna SIL (Indic)', rtl: false },
    { value: 'Scheherazade', label: 'Scheherazade (Arabic)', rtl: true },
    { value: 'SimSun', label: 'SimSun (Chinese)', rtl: false },
  ];

  const selectFont = (tag: LangTag | undefined) => {
    if (!tag || tag.tag === 'und') return;
    let code = tag.script + '-' + tag.region;
    if (!fontMap.hasOwnProperty(code)) {
      code = tag.script;
    }
    if (!fontMap.hasOwnProperty(code)) {
      setDefaultFont(safeFonts[0].value);
      setCurFont(safeFonts[0].value);
      setFontOpts(safeFonts.map(f => f.value));
    } else {
      const fonts = fontMap[code];
      setDefaultFont(fonts[0]);
      setCurFont(fonts[0]);
      setFontOpts(fonts);
    }
  };

  React.useEffect(() => {
    if (response === '') handleClear();
  }, [response]);

  React.useEffect(() => {
    setCurValue(value);
    setCurName(name);
    setCurFont(font);
    setResponse(value !== 'und' ? name + ' (' + value + ')' : '');
  }, [value, name, font]);

  const handleScriptChange = (tag: LangTag | undefined) => (e: any) => {
    const val = e.target.value;
    setDefaultScript(val);
    if (tag && tag.script !== val) {
      const lgTag = tag.tag.split('-')[0];
      const newTag = langTags.filter(
        t => t.tag.split('-')[0] === lgTag && t.script === val
      );
      if (newTag.length > 0) {
        setTag(newTag[0]);
      }
      displayTag(newTag[0]);
      selectFont(newTag[0]);
    } else selectFont(tag);
  };

  const selectScript = (tag: LangTag) => {
    const tagParts = tag.tag.split('-');
    const lgTag = tagParts[0];
    if (getScripts(lgTag).length !== 1) {
      if (tagParts.length > 1 && tagParts[1].length === 4) {
        selectFont(tag);
        return;
      }
      setDefaultScript(getScripts(lgTag)[0]);
    } else {
      selectFont(tag);
    }
  };

  const scriptList = (tag: LangTag | undefined) => {
    if (!tag) return [];
    return getScripts(tag.tag.split('-')[0]);
  };

  const handleLanguageClick = () => {
    if (tag) selectScript(tag);
    setTag(undefined);
  };

  const handleChoose = (tag: LangTag) => {
    setTag(tag);
    const ext = response.indexOf(ExtStr);
    displayTag(
      ext === -1 ? tag : { ...tag, tag: tag.tag + response.slice(ext) }
    );
    selectScript(tag);
  };

  const mergeList = (list: number[], adds: number[]) => {
    let result = list.filter(e => adds.filter(f => e === f).length > 0);
    result = result.concat(
      list.filter(e => adds.filter(f => e === f).length === 0)
    );
    return result.concat(
      adds.filter(e => list.filter(f => e === f).length === 0)
    );
  };

  const optList = () => {
    if (!tag) {
      let list = Array<number>();
      response.split(' ').forEach(w => {
        const token = woBadChar(w).toLocaleLowerCase();
        if (hasExact(token)) {
          list = mergeList(list, getExact(token));
        }
      });
      response.split(' ').forEach(w => {
        const token = woBadChar(w).toLocaleLowerCase();
        if (subtag && hasPartial(token.slice(0, 3))) {
          list = mergeList(list, getPartial(token.slice(0, 3)));
        }
        if (!subtag && hasNoSubTag(token.slice(0, 3))) {
          list = mergeList(list, getNoSubTag(token.slice(0, 3)));
        }
      });
      if (list.length > 0) {
        return (
          <>
            <FormGroup row className={classes.check}>
              <FormControlLabel
                className={classes.label}
                control={
                  <Checkbox
                    checked={subtag}
                    onChange={event => setSubtag(event.target.checked)}
                    value="secondary"
                  />
                }
                label={t.subtags}
              />
              <FormControlLabel
                className={classes.label2}
                control={
                  <Checkbox
                    checked={secondary}
                    onChange={event => setSecondary(event.target.checked)}
                    value="secondary"
                  />
                }
                label={t.details}
              />
            </FormGroup>
            <LanguageChoice
              list={list}
              secondary={secondary}
              choose={handleChoose}
              subtag={subtag}
              langTags={langTags}
              scriptName={scriptName}
            />
          </>
        );
      }
    }
    return <></>;
  };

  return (
    <div id="LangBcp47">
      <TextField
        variant="filled"
        margin="dense"
        id="lang-bcp47"
        label={t.language}
        required={true}
        style={{ width: 300 }}
        value={value !== 'und' ? name + ' (' + value + ')' : ''}
        onClick={handleClickOpen}
        onKeyDown={handleClickOpen}
        disabled={disabled ? disabled : false}
      />
      <Dialog
        id="LanguagePicker"
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{t.selectLanguage}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="normal"
            id="language"
            label={t.findALanguage}
            fullWidth
            value={response}
            onChange={handleChange}
            onClick={handleLanguageClick}
            variant="outlined"
            InputProps={{
              ref: langEl,
              endAdornment: (
                <InputAdornment
                  position="end"
                  className={clsx({ [classes.hide]: response === '' })}
                >
                  <IconButton
                    edge="end"
                    aria-label="clear language"
                    onClick={handleClear}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {optList()}
          <FormControlLabel
            control={
              <TextField
                id="select-script"
                select
                className={classes.textField}
                label={t.script}
                value={defaultScript}
                onChange={handleScriptChange(tag)}
                style={{ width: 300 }}
                SelectProps={{
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText={''}
                margin="normal"
                variant="filled"
                required={true}
              >
                {scriptList(tag).map(s => (
                  <MenuItem key={s} value={s}>
                    {scriptName[s] + ' - ' + s}
                  </MenuItem>
                ))}
              </TextField>
            }
            label=""
          />
          <FormControlLabel
            control={
              <TextField
                id="select-font"
                select
                className={classes.fontField}
                label={t.font}
                value={defaultFont}
                onChange={addFontInfo}
                SelectProps={{
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText={''}
                margin="normal"
                variant="filled"
                required={true}
              >
                {fontOpts.map(s => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            }
            label=""
          />
        </DialogContent>
        <DialogActions>
          <a
            href="https://www.w3.org/International/questions/qa-choosing-language-tags"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Typography>{t.codeExplained}</Typography>
          </a>
          <div className={classes.grow}>{'\u00A0'}</div>
          <Button onClick={handleCancel} color="primary">
            <Typography>{t.cancel}</Typography>
          </Button>
          <Button
            onClick={handleSelect}
            color="primary"
            disabled={tag === undefined}
          >
            <Typography>{t.select}</Typography>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'languagePicker' }),
});

export default connect(mapStateToProps)(LanguagePicker);
