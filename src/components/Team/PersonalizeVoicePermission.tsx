import { Stack, StackProps, styled, TextField } from '@mui/material';
import React from 'react';
import { Options } from '../../control';

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  '& * > .MuiBox-root': {
    display: 'inline-flex',
    alignItems: 'center',
  },
}));

interface IDecorations {
  [key: string]: JSX.Element;
}

export interface IPermission {
  fullName?: string;
  gender?: string;
  age?: string;
  languages?: string;
  sponsor?: string;
  team?: string;
  scope?: string;
}

interface IProps {
  state: IPermission;
  setState: React.Dispatch<React.SetStateAction<IPermission>>;
}

export default function PersonalizeVoicePermission(props: IProps) {
  const { state, setState } = props;
  const [minorMsg, setMinorMsg] = React.useState('');
  const [decorations, setDecorations] = React.useState<IDecorations>({});

  const options: string[] = ['This team', 'All teams'];

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
    setState((state) => ({
      ...state,
      [event.target.name]: event.target.value,
    }));
  };

  const handleScope = (option: string) => {
    setState((state) => ({ ...state, scope: option }));
  };

  React.useEffect(() => {
    setDecorations({
      [options[1]]: (
        <Stack spacing={1} sx={{ p: 1 }}>
          <TextField
            name="gender"
            label="Gender"
            variant="outlined"
            value={state?.gender ?? ''}
            onChange={handleChange}
            disabled={state?.scope !== options[1]}
          />
          <TextField
            name="age"
            label="Age"
            variant="outlined"
            value={state?.age ?? ''}
            onChange={handleChange}
            helperText={minorMsg}
            disabled={state?.scope !== options[1]}
          />
          <TextField
            name="languages"
            label="Languages"
            variant="outlined"
            value={state?.languages ?? ''}
            onChange={handleChange}
            disabled={state?.scope !== options[1]}
          />
        </Stack>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, minorMsg]);

  return (
    <StyledStack spacing={1} sx={{ py: 1 }}>
      <TextField
        name="fullName"
        label="Full Name"
        variant="outlined"
        value={state?.fullName ?? ''}
        onChange={handleChange}
      />
      <Options
        label={'Scope of use'}
        options={options}
        defaultValue={state?.scope ?? options[0]}
        onChange={handleScope}
        decorations={decorations}
      />
      <TextField
        name="sponsor"
        label="Sponsor"
        variant="outlined"
        value={state?.sponsor ?? 'SIL Global'}
        onChange={handleChange}
      />
    </StyledStack>
  );
}
