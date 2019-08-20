import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, ILanguagePickerStrings } from '../model';
import localStrings from '../selector/localize';
import {
  LangTagMap,
  LangTag,
  ScriptList,
  FontMap,
  IRanked,
  ScriptName,
} from '../store/langPicker/types';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
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
import { woBadChar } from '../store/langPicker/reducers';
import LanguageChoice from './LanguageChoice';
import './LanguagePicker.css';
import clsx from 'clsx';

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
      width: 100,
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
  })
);

interface StateProps {
  t: ILanguagePickerStrings;
  exact: LangTagMap;
  partial: LangTagMap;
  scripts: ScriptList;
  noSubtag: LangTagMap;
  langTags: LangTag[];
  fontMap: FontMap;
  scriptName: ScriptName;
}

interface DispatchProps {}

interface IProps extends StateProps, DispatchProps {
  value: string;
  name: string;
  font: string;
  setCode?: (code: string) => void;
  setName?: (name: string) => void;
  setFont?: (font: string) => void;
  // local stat props go here
}

export const LanguagePicker = (props: IProps) => {
  const {
    t,
    exact,
    partial,
    noSubtag,
    langTags,
    scripts,
    fontMap,
    scriptName,
  } = props;
  const { value, name, font, setCode, setName, setFont } = props;
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [secondary, setSecondary] = React.useState(true);
  const [subtag, setSubtag] = React.useState(false);
  const [response, setResponse] = React.useState('');
  const [tag, setTag] = React.useState<LangTag>();
  const [scriptField, setScriptField] = React.useState(<></>);
  const [fontField, setFontField] = React.useState(<></>);
  const [defaultFont, setDefaultFont] = React.useState('');
  const [fontOpts, setFontOpts] = React.useState(Array<string>());
  const langEl = React.useRef<any>();

  const handleClickOpen = (e: any) => {
    if (e.keyCode && e.keyCode === 9) return;
    const key = value.toLocaleLowerCase();
    if (exact.hasOwnProperty(key)) {
      setResponse(name + ' (' + value + ')');
      const langTag = langTags[exact[key][0].index];
      setTag(langTag);
      selectFont(langTag);
      setDefaultFont(font);
      setScriptField(<></>);
    } else {
      handleClear();
    }
    setOpen(true);
  };
  const handleClear = () => {
    setFontOpts([]);
    setScriptField(<></>);
    setResponse('');
    setTag(undefined);
    setDefaultFont('');
    if (langEl.current) langEl.current.click();
  };
  const handleCancel = () => {
    setResponse('');
    setOpen(false);
  };

  const displayTag = (tag: LangTag) => {
    if (tag && tag.name) {
      setResponse(tag.name + ' (' + tag.tag + ')');
      if (setCode) setCode(tag.tag);
      if (setName) setName(tag.name);
    }
  };

  const handleSelect = () => {
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
    if (setFont) setFont(e.target.value);
  };

  const safeFonts = [
    { value: 'Noto Sans', label: 'Noto Sans (Recommended)', rtl: false },
    { value: 'Annapurna SIL', label: 'Annapurna SIL (Indic)', rtl: false },
    { value: 'Scheherazade', label: 'Scheherazade (Arabic)', rtl: true },
    { value: 'SimSun', label: 'SimSun (Chinese)', rtl: false },
  ];

  const selectFont = (tag: LangTag) => {
    let code = tag.script + '-' + tag.region;
    if (!fontMap.hasOwnProperty(code)) {
      code = tag.script;
    }
    if (!fontMap.hasOwnProperty(code)) {
      setDefaultFont(safeFonts[0].value);
      if (setFont) setFont(safeFonts[0].value);
      setFontOpts(safeFonts.map(f => f.value));
    } else if (fontMap[code].length === 1) {
      setDefaultFont(fontMap[code][0]);
      if (setFont) setFont(fontMap[code][0]);
    } else {
      const fonts = fontMap[code];
      setDefaultFont(fonts[0]);
      if (setFont) setFont(fonts[0]);
      setFontOpts(fonts);
    }
  };

  React.useEffect(() => {
    if (fontOpts.length > 0) {
      setFontField(
        <FormControlLabel
          control={
            <TextField
              id="select-font"
              autoFocus
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
      );
    } else {
      setFontField(<></>);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [defaultFont, fontOpts, classes]);

  React.useEffect(() => {
    if (response === '') handleClear();
  }, [response]);

  React.useEffect(() => {
    // If we are changing the query...
    if (tag === undefined && langEl.current) langEl.current.click();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [scriptField]);

  const handleScriptChange = (tag: LangTag) => (e: any) => {
    const val = e.target.value;
    if (tag.script !== val) {
      const lgTag = tag.tag.split('-')[0];
      const newTag = langTags.filter(
        t => t.tag.split('-')[0] === lgTag && t.script === val
      );
      if (newTag.length > 0) {
        setTag(newTag[0]);
      }
      displayTag(newTag[0]);
    }
    setScriptField(<></>);
    selectFont(tag);
  };

  const selectScript = (tag: LangTag) => {
    const tagParts = tag.tag.split('-');
    const lgTag = tagParts[0];
    if (scripts[lgTag].length !== 1) {
      if (tagParts.length > 1 && tagParts[1].length === 4) {
        setScriptField(<></>);
        selectFont(tag);
        return;
      }
      const defaultScript = scripts[lgTag][0];
      setScriptField(
        <FormControlLabel
          control={
            <TextField
              id="select-script"
              autoFocus
              select
              className={classes.textField}
              label={t.script}
              value={defaultScript}
              onChange={handleScriptChange(tag)}
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
              {scripts[lgTag].map(s => (
                <MenuItem key={s} value={s}>
                  {scriptName[s] + ' - ' + s}
                </MenuItem>
              ))}
            </TextField>
          }
          label=""
        />
      );
    } else {
      setScriptField(<></>);
      selectFont(tag);
    }
  };

  const handleLanguageClick = () => {
    if (tag) selectScript(tag);
    setTag(undefined);
  };

  const handleChoose = (tag: LangTag) => {
    setTag(tag);
    displayTag(tag);
    selectScript(tag);
  };

  const mergeList = (list: IRanked[], adds: IRanked[]) => {
    let result = list.filter(
      e => adds.filter(f => e.index === f.index).length > 0
    );
    result = result.concat(
      list.filter(e => adds.filter(f => e.index === f.index).length === 0)
    );
    return result.concat(
      adds.filter(e => list.filter(f => e.index === f.index).length === 0)
    );
  };

  const optList = () => {
    if (!tag) {
      let list = Array<IRanked>();
      response.split(' ').forEach(w => {
        const token = woBadChar(w).toLocaleLowerCase();
        if (exact.hasOwnProperty(token)) {
          list = mergeList(list, exact[token]);
        }
      });
      response.split(' ').forEach(w => {
        const token = woBadChar(w).toLocaleLowerCase();
        if (subtag && partial.hasOwnProperty(token.slice(0, 3))) {
          list = mergeList(list, partial[token.slice(0, 3)]);
        }
        if (!subtag && noSubtag.hasOwnProperty(token.slice(0, 3))) {
          list = mergeList(list, noSubtag[token.slice(0, 3)]);
        }
      });
      if (list.length > 0) {
        return (
          <LanguageChoice
            list={list}
            secondary={secondary}
            choose={handleChoose}
            subtag={subtag}
          />
        );
      }
    }
    return <></>;
  };

  const reactStringReplace = require('react-string-replace');
  return (
    <div>
      <TextField
        variant="filled"
        margin="dense"
        id="lang-bcp47"
        label={t.language}
        required={true}
        style={{ width: 300 }}
        value={name + ' (' + value + ')'}
        onClick={handleClickOpen}
        onKeyDown={handleClickOpen}
      />
      <Dialog
        id="LanguagePicker"
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          <Typography>{t.select}</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography>
              {reactStringReplace(t.instructions, /\{(\d+)\}/g, () => (
                <a
                  href="https://www.w3.org/International/questions/qa-choosing-language-tags"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.code}
                </a>
              ))}
            </Typography>
          </DialogContentText>
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
          <TextField
            autoFocus
            margin="dense"
            id="language"
            label={t.language}
            fullWidth
            value={response}
            onChange={handleChange}
            onClick={handleLanguageClick}
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
          {scriptField}
          {fontField}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            <Typography>Cancel</Typography>
          </Button>
          <Button
            onClick={handleSelect}
            color="primary"
            disabled={tag === undefined}
          >
            <Typography>Select</Typography>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const mapStateToProps = (state: IState): StateProps => ({
  t: localStrings(state, { layout: 'languagePicker' }),
  exact: state.langTag.exact,
  partial: state.langTag.partial,
  scripts: state.langTag.scripts,
  noSubtag: state.langTag.noSubtag,
  langTags: state.langTag.langTags,
  fontMap: state.langTag.fontMap,
  scriptName: state.langTag.scriptNames,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LanguagePicker);
