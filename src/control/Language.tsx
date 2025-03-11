import React, { CSSProperties } from 'react';
import {
  TextField,
  Checkbox,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Box,
  SxProps,
  styled,
  FormControlLabelProps,
} from '@mui/material';
import { LanguagePicker, LangTag } from 'mui-language-picker';
import { useSelector, shallowEqual } from 'react-redux';
import { vProjectSelector, pickerSelector } from '../selector';
import { fontFamilyName } from '../utils/fontFamilyName';
import { IPickerStrings, IVProjectStrings } from '../model';

const StyledFormControlLabel = styled(FormControlLabel)<FormControlLabelProps>({
  '& .MuiFormControlLabel-asterisk': {
    display: 'none',
  },
});

export interface ILanguage {
  bcp47: string;
  languageName: string;
  font: string;
  rtl: boolean;
  spellCheck: boolean;
  info?: LangTag;
}

export const initLang: ILanguage = {
  bcp47: 'und',
  languageName: '',
  font: '',
  rtl: false,
  spellCheck: false,
};

interface IProps extends ILanguage {
  onChange: (state: ILanguage) => void;
  filter?: (code: string) => boolean;
  hideSpelling?: boolean;
  hideFont?: boolean;
  disabled?: boolean;
  required?: boolean;
  sx?: SxProps;
}

export const Language = (props: IProps) => {
  const {
    bcp47,
    languageName,
    font,
    rtl,
    spellCheck,
    required,
    sx,
    onChange,
    filter,
    hideFont,
  } = props;
  const [state, setState] = React.useState<ILanguage>({
    bcp47,
    languageName,
    font,
    rtl,
    spellCheck,
  });
  const t: IVProjectStrings = useSelector(vProjectSelector, shallowEqual);
  const lt: IPickerStrings = useSelector(pickerSelector, shallowEqual);
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

  const handleDir = (rtl: boolean) => {
    setState((state) => ({ ...state, rtl }));
  };

  const handleInfo = (info: LangTag) => {
    setState((state) => ({ ...state, info }));
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

  const widthStyle: CSSProperties = { width: 300 };

  const fullBox = React.useMemo(() => {
    if (props.hideSpelling && props.hideFont) return undefined;
    return { pt: 3 };
  }, [props.hideSpelling, props.hideFont]);

  return (
    <Box sx={fullBox}>
      {fullBox && (
        <FormLabel sx={{ color: 'secondary.main' }}>{t.language}</FormLabel>
      )}
      <FormGroup sx={fullBox || undefined}>
        <StyledFormControlLabel
          id="language-code"
          ref={langEl}
          sx={sx ?? { ml: 0 }}
          control={
            <LanguagePicker
              required={required ?? true}
              value={bcp47 || 'und'}
              name={languageName ?? ''}
              font={font ?? ''}
              setCode={handleBcp47}
              setName={handleLanguage}
              setFont={handleFont}
              setDir={handleDir}
              setInfo={handleInfo}
              filter={filter}
              t={lt}
              disabled={props.disabled}
              noScript={hideFont ? true : undefined}
              noFont={hideFont ? true : undefined}
            />
          }
          label=""
        />
        {!Boolean(props?.hideFont) && (
          <FormControlLabel
            control={
              <TextField
                id="language-font"
                label={t.font}
                sx={{ mx: 1, marginLeft: '11px' }}
                value={fontFamilyName(font)}
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
        )}
        {!Boolean(props?.hideSpelling) && (
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
        )}
      </FormGroup>
    </Box>
  );
};
