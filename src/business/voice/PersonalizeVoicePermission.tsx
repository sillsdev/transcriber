import React from 'react';
import {
  Checkbox,
  FormControlLabel,
  Stack,
  StackProps,
  styled,
  TextField,
  Typography,
} from '@mui/material';
import { Options } from '../../control';

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
  const [curState, setCurState] = React.useState(state);
  const [minorMsg, setMinorMsg] = React.useState('');
  const [decorations, setDecorations] = React.useState<IDecorations>({});
  const localOptions: IVoicePermOpts = {
    thisTeam: 'This team',
    anyTeam: 'Any team',
  };

  React.useEffect(() => {
    setCurState(state);
  }, [state]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'age') {
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
    setState && setState(updateTarget);
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

  React.useEffect(() => {
    setDecorations({
      [localOptions[voicePermOpts[1]]]: (
        <Stack spacing={1} sx={{ p: 1 }}>
          <TextField
            name="gender"
            label="Gender"
            variant="outlined"
            value={curState?.gender ?? ''}
            onChange={handleChange}
            disabled={curState?.scope !== voicePermOpts[1]}
          />
          <TextField
            name="age"
            label="Age"
            variant="outlined"
            value={curState?.age ?? ''}
            onChange={handleChange}
            helperText={minorMsg}
            disabled={curState?.scope !== voicePermOpts[1]}
          />
          <TextField
            name="languages"
            label="Excluded Languages"
            variant="outlined"
            value={curState?.languages ?? ''}
            onChange={handleChange}
            disabled={curState?.scope !== voicePermOpts[1]}
          />
        </Stack>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curState, minorMsg]);

  return (
    <StyledStack spacing={1} sx={{ py: 1 }}>
      <Typography variant="h6">{`Options for ${
        curState?.fullName ?? 'your'
      } voice:`}</Typography>
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
