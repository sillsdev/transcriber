import React, { useEffect } from 'react';
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Stack,
  StackProps,
  styled,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material';
import { ILanguage, Language, initLang, Options } from '../../control';
import { shallowEqual, useSelector } from 'react-redux';
import { voiceSelector } from '../../selector';
import { IVoiceStrings } from '../../model';
import { getLangTag } from 'mui-language-picker';

export const voicePermOpts: string[] = ['thisTeam', 'allTeams'];

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  '& * > .MuiBox-root': {
    display: 'inline-flex',
    alignItems: 'center', // center cancel button
  },
}));

const StyledTextField = styled(TextField)<TextFieldProps>(({ theme }) => ({
  '& .MuiAutocomplete-popupIndicator': {
    display: 'none', // hide the dropdown arrow
  },
}));

interface IDecorations {
  [key: string]: JSX.Element;
}

export interface IVoicePerm {
  fullName?: string;
  gender?: string;
  age?: string;
  languages?: string;
  hired?: boolean;
  sponsor?: string;
  team?: string;
  scope?: string;
  valid?: boolean;
}

interface IProps {
  state: IVoicePerm;
  setState?: React.Dispatch<React.SetStateAction<IVoicePerm>>;
}

export default function PersonalizeVoicePermission(props: IProps) {
  const { state, setState } = props;
  const [excludeName, setExcludeName] = React.useState(false);
  const [inName, setInName] = React.useState('');
  const [language, setLanguage] = React.useState<ILanguage>();
  const [curState, setCurState] = React.useState(state);
  const [minorMsg, setMinorMsg] = React.useState('');
  const [genderMsg, setGenderMsg] = React.useState('');
  const [decorations, setDecorations] = React.useState<IDecorations>({});
  const langEl = React.useRef<any>();
  const t: IVoiceStrings = useSelector(voiceSelector, shallowEqual);
  const localOptions = voicePermOpts.map((option) => t.getString(option));
  const [hideLang, setHideLang] = React.useState(false);

  const genderValid = (value?: string) => /^[a-zA-Z]{0,15}$/.test(value ?? '');

  const ageValid = (value?: string) => /^[0-9]*$/.test(value ?? '');

  const allValid = (state: IVoicePerm) =>
    genderValid(state.gender) && ageValid(state.age);

  const handleChangeGender = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valid = genderValid(event.target.value);
    setGenderMsg(valid ? '' : t.genderOneWord);
    const updateTarget = (state: IVoicePerm) => ({
      ...state,
      [event.target.name]: event.target.value,
      valid: allValid({ ...state, [event.target.name]: event.target.value }),
    });
    setCurState(updateTarget);
    if (valid) setState && setState(updateTarget);
  };

  const handleChangeAge = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valid = ageValid(event.target.value);
    if (!valid) {
      setMinorMsg(t.ageAsNumber);
    } else {
      const newValue = parseInt(event.target.value);
      if (newValue < 18) {
        setMinorMsg(t.age18);
      } else {
        setMinorMsg('');
      }
    }
    const updateTarget = (state: IVoicePerm) => ({
      ...state,
      [event.target.name]: event.target.value,
      valid: allValid({ ...state, [event.target.name]: event.target.value }),
    });
    setCurState(updateTarget);
    if (valid) setState && setState(updateTarget);
  };

  const handleScope = (option: string) => {
    let scope = voicePermOpts[localOptions.indexOf(option)];
    const updateScope = (state: IVoicePerm) => ({ ...state, scope });
    setCurState(updateScope);
    setState && setState(updateScope);
  };

  const handleCheck = () => {
    const updateHired = (state: IVoicePerm) => ({
      ...state,
      hired: !state.hired,
    });
    setCurState(updateHired);
    setState && setState(updateHired);
  };

  const handleExcludeName = (
    _e: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    const newState = {
      ...curState,
      fullName: checked ? undefined : inName,
    };
    setCurState(newState);
    setState && setState(newState);
    setExcludeName(checked);
  };

  const handleLanguageChange = (language: ILanguage) => {
    if (language.bcp47 === 'und') return;
    const curLangs = JSON.parse(curState?.languages ?? '[]');
    if (curLangs.some((l: ILanguage) => l.bcp47 === language.bcp47)) return;
    const newState = {
      ...curState,
      languages: JSON.stringify(curLangs.concat([language])),
    };
    setCurState(newState);
    setState && setState(newState);
    setLanguage(undefined);
    setHideLang(true);
  };

  useEffect(() => {
    if (!hideLang) return;
    setHideLang(false);
  }, [hideLang]);

  const handleExcludeChange = (
    event: React.SyntheticEvent,
    newValue: ILanguage[]
  ) => {
    const codes = new Set(newValue.map((l) => l.bcp47));
    if (codes.size !== newValue.length) return; // no duplicates
    const newState = {
      ...curState,
      languages: JSON.stringify(newValue),
    };
    setCurState(newState);
    setState && setState(newState);
  };

  const handleExcludeClick = (e: any) => {
    langEl.current.click();
    e.stopPropagation();
  };

  const TAB = 9;
  const SHIFT = 16;
  const CTRL = 17;

  const handleExcludeKey = (e: any) => {
    if (langEl.current && e.keyCode && ![TAB, SHIFT, CTRL].includes(e.keyCode))
      langEl.current.click();
    e.stopPropagation();
  };

  const handleFilter = (code: string) => {
    const langTag = getLangTag(code);
    if (['Zxxx', 'Sgnw', 'Brai'].includes(langTag?.script ?? '')) return false;
    const curLangs = JSON.parse(curState?.languages ?? '[]');
    if (curLangs.some((l: ILanguage) => l.bcp47 === code)) return false;
    return true;
  };

  React.useEffect(() => {
    setInName(state?.fullName ?? '');
    return () => {
      setInName('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const excludeOptions = React.useMemo(
    () => JSON.parse(curState?.languages ?? '[]'),
    [curState?.languages]
  );

  React.useEffect(() => {
    setDecorations({
      [t.allTeams]: (
        <Stack spacing={1} sx={{ p: 1 }}>
          <TextField
            name="gender"
            label={t.gender}
            variant="outlined"
            value={curState?.gender ?? ''}
            onChange={handleChangeGender}
            helperText={genderMsg}
            disabled={curState?.scope !== voicePermOpts[1]}
          />
          <TextField
            name="age"
            label={t.age}
            variant="outlined"
            value={curState?.age ?? ''}
            onChange={handleChangeAge}
            helperText={minorMsg}
            disabled={curState?.scope !== voicePermOpts[1]}
          />
          <FormControlLabel
            id="lang-control"
            ref={langEl}
            sx={{ display: 'none' }}
            control={
              hideLang ? (
                <></>
              ) : (
                <Language
                  {...(language ?? initLang)}
                  filter={handleFilter}
                  hideFont
                  hideSpelling
                  required={false}
                  onChange={handleLanguageChange}
                />
              )
            }
            label=""
          />
          <Autocomplete
            multiple
            id="excluded-languages"
            options={excludeOptions}
            getOptionLabel={(option: ILanguage) =>
              `${option.languageName} (${option.bcp47})`
            }
            value={excludeOptions}
            onChange={handleExcludeChange}
            renderInput={(params) => (
              <StyledTextField
                {...params}
                variant="outlined"
                label={t.excludedLanguages}
                onClick={handleExcludeClick}
                onKeyDown={handleExcludeKey}
              />
            )}
          />
        </Stack>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curState, minorMsg, language, hideLang]);

  return (
    <StyledStack spacing={1} sx={{ py: 1 }}>
      <Typography variant="h6">
        {t.voiceOptions.replace('{0}', curState?.fullName ?? 'your')}
      </Typography>
      <FormControlLabel
        control={
          <Checkbox checked={excludeName} onChange={handleExcludeName} />
        }
        label={t.excludeName}
      />
      <FormControlLabel
        control={
          <Checkbox
            name="hired"
            checked={curState?.hired ?? false}
            onClick={handleCheck}
          />
        }
        label={t.forHire}
      />
      <Options
        label={t.scope}
        options={localOptions}
        defaultValue={t.getString(curState?.scope ?? voicePermOpts[0])}
        onChange={handleScope}
        decorations={decorations}
      />
    </StyledStack>
  );
}
