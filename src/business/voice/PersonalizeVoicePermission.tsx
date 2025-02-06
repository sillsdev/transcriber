import React from 'react';
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Stack,
  StackProps,
  styled,
  TextField,
  Typography,
} from '@mui/material';
import { ILanguage, Language, initLang, Options } from '../../control';
import { shallowEqual, useSelector } from 'react-redux';
import { voiceSelector } from '../../selector';
import { IVoiceStrings } from '../../model';

export const voicePermOpts: string[] = ['thisTeam', 'allTeams'];

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  '& * > .MuiBox-root': {
    display: 'inline-flex',
    alignItems: 'center',
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

  const handleChangeGender = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valid = /^[a-zA-Z]{0,15}$/.test(event.target.value);
    setGenderMsg(valid ? '' : t.genderOneWord);
    const updateTarget = (state: IVoicePerm) => ({
      ...state,
      [event.target.name]: event.target.value,
    });
    setCurState(updateTarget);
    if (valid) setState && setState(updateTarget);
  };

  const handleChangeAge = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valid = /^[0-9]*$/.test(event.target.value);
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
    });
    setCurState(updateTarget);
    if (valid) setState && setState(updateTarget);
  };

  const handleScope = (option: string) => {
    let scope = option;
    for (const [key, value] of Object.entries(localOptions)) {
      if (value === option) {
        scope = key;
        break;
      }
    }
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
  };

  const handleExcludeChange = (
    event: React.SyntheticEvent,
    newValue: ILanguage[]
  ) => {
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

  React.useEffect(() => {
    setInName(state?.fullName ?? '');
    return () => {
      setInName('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <Language
                {...(language ?? initLang)}
                hideFont
                hideSpelling
                required={false}
                onChange={handleLanguageChange}
              />
            }
            label=""
          />
          <Autocomplete
            multiple
            id="excluded-languages"
            options={JSON.parse(curState?.languages ?? '[]')}
            getOptionLabel={(option: ILanguage) =>
              `${option.languageName} (${option.bcp47})`
            }
            value={JSON.parse(curState?.languages ?? '[]')}
            onChange={handleExcludeChange}
            renderInput={(params) => (
              <TextField
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
  }, [curState, minorMsg, language]);

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
      <Options
        label={t.scope}
        options={localOptions}
        defaultValue={t.getString(curState?.scope ?? voicePermOpts[0])}
        onChange={handleScope}
        decorations={decorations}
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
    </StyledStack>
  );
}
