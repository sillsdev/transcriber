import * as React from 'react';
import { ActionRow, AltButton, GrowingSpacer, PriButton } from '../../control';
import { Divider, Stack, TextField } from '@mui/material';
import { ISharedStrings, Organization } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
import { IVoicePerm } from './PersonalizeVoicePermission';
import { orgDefaultVoices, useOrgDefaults } from '../../crud';

interface ISelectVoice {
  team?: Organization;
  refresh?: () => void;
  onOpen: () => void;
}

export default function SelectVoice({ team, refresh, onOpen }: ISelectVoice) {
  const [voice, setVoice] = React.useState<string>();
  const [permState, setPermState] = React.useState<IVoicePerm>({});
  const { getDefault, setDefault } = useOrgDefaults();
  const t: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  React.useEffect(() => {
    if (team) {
      const voices = getDefault(orgDefaultVoices, team);
      if (voices) {
        setVoice(voices?.voice);
        setPermState(voices?.permission ?? {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  const handleSave = () => {
    if (team) {
      setDefault(orgDefaultVoices, { voice, permission: permState }, team);
      refresh?.();
    }
    onOpen();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPermState((state) => ({
      ...state,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <Stack sx={{ minWidth: 120, pt: 2 }} spacing={2}>
      <TextField
        name="sponsor"
        label="Sponsor"
        variant="outlined"
        value={permState?.sponsor ?? 'SIL Global'}
        onChange={handleChange}
      />
      <Divider sx={{ pt: 2 }} />
      <ActionRow>
        <GrowingSpacer />
        <AltButton onClick={onOpen}>{t.cancel}</AltButton>
        <PriButton onClick={handleSave}>{t.save}</PriButton>
      </ActionRow>
    </Stack>
  );
}
