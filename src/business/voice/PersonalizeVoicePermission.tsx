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

export const voicePermOpts: string[] = ['thisTeam', 'anyTeam'];
interface IVoicePermOpts {
  [key: string]: string;
}

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
  const [language, setLanguage] = React.useState<ILanguage>();
  const [curState, setCurState] = React.useState(state);
  const [minorMsg, setMinorMsg] = React.useState('');
  const [genderMsg, setGenderMsg] = React.useState('');
  const [decorations, setDecorations] = React.useState<IDecorations>({});
  const localOptions: IVoicePermOpts = {
    thisTeam: 'This team',
    anyTeam: 'Any team',
  };

  const handleChangeGender = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valid = /^[a-zA-Z]{0,15}$/.test(event.target.value);
    if (!valid) {
      setGenderMsg('Gender must be a single word.');
    } else {
      setGenderMsg('');
    }
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
      setMinorMsg('Age must be a number.');
    } else {
      const newValue = parseInt(event.target.value);
      if (newValue < 18) {
        setMinorMsg(
          'You must be 18 years or older to give consent to use your voice.'
        );
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
      fullName: checked ? undefined : props.state.fullName,
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

  React.useEffect(() => {
    setDecorations({
      [localOptions[voicePermOpts[1]]]: (
        <Stack spacing={1} sx={{ p: 1 }}>
          <TextField
            name="gender"
            label="Gender"
            variant="outlined"
            value={curState?.gender ?? ''}
            onChange={handleChangeGender}
            helperText={genderMsg}
            disabled={curState?.scope !== voicePermOpts[1]}
          />
          <TextField
            name="age"
            label="Age"
            variant="outlined"
            value={curState?.age ?? ''}
            onChange={handleChangeAge}
            helperText={minorMsg}
            disabled={curState?.scope !== voicePermOpts[1]}
          />
          <Language
            {...(language ?? initLang)}
            hideFont
            hideSpelling
            required={false}
            onChange={handleLanguageChange}
          />
          <Autocomplete
            multiple
            id="excluded-languages"
            disabled={(curState?.languages ?? '[]') === '[]'}
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
                label="Excluded languages"
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
      <Typography variant="h6">{`Options for ${
        curState?.fullName ?? 'your'
      } voice:`}</Typography>
      {!excludeName && (
        <FormControlLabel
          control={
            <Checkbox checked={excludeName} onChange={handleExcludeName} />
          }
          label={'Exclude name?'}
        />
      )}
      <Options
        label={'Scope of use'}
        options={voicePermOpts.map((option) => localOptions[option])}
        defaultValue={localOptions[curState?.scope ?? voicePermOpts[0]]}
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
        label="Work for hire?"
      />
    </StyledStack>
  );
}
