import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState } from '../model';
import {
  LangTagMap,
  LangTag,
  ScriptList,
  FontMap,
  IRanked,
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
  exact: LangTagMap;
  partial: LangTagMap;
  scripts: ScriptList;
  noSubtag: LangTagMap;
  langTags: LangTag[];
  fontMap: FontMap;
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
  const { exact, partial, noSubtag, langTags, scripts, fontMap } = props;
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
    if (exact.hasOwnProperty(value)) {
      setResponse(name + ' (' + value + ')');
      const langTag = langTags[exact[value][0].index];
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

  const selectFont = (tag: LangTag) => {
    let code = tag.script + '-' + tag.region;
    if (!fontMap.hasOwnProperty(code)) {
      code = tag.script;
    }
    if (!fontMap.hasOwnProperty(code)) return;
    if (fontMap[code].length === 1) {
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
              label={'Font'}
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

  const handleChoose = (tag: LangTag) => {
    setTag(tag);
    displayTag(tag);
    const tagParts = tag.tag.split('-');
    const lgTag = tagParts[0];
    if (scripts[lgTag].length !== 1) {
      if (tagParts.length > 1 && tagParts[1].length === 4) {
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
              label={'Script'}
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
                  {s}
                </MenuItem>
              ))}
            </TextField>
          }
          label=""
        />
      );
    } else {
      selectFont(tag);
    }
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

  return (
    <div>
      <TextField
        variant="filled"
        margin="dense"
        id="lang-bcp47"
        label="Language"
        required={true}
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
          <Typography>Select a Language</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography>
              Type the language name or{' '}
              <a
                href="https://www.w3.org/International/questions/qa-choosing-language-tags"
                target="_blank"
                rel="noopener noreferrer"
              >
                code
              </a>
              . Languages can also be found by country.
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
              label="Subtags"
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
              label="Details"
            />
          </FormGroup>
          <TextField
            autoFocus
            margin="dense"
            id="language"
            label="Language"
            fullWidth
            value={response}
            onChange={handleChange}
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
          <Button onClick={handleSelect} color="primary">
            <Typography>Select</Typography>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const mapStateToProps = (state: IState): StateProps => ({
  exact: state.langTag.exact,
  partial: state.langTag.partial,
  scripts: state.langTag.scripts,
  noSubtag: state.langTag.noSubtag,
  langTags: state.langTag.langTags,
  fontMap: state.langTag.fontMap,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LanguagePicker);
