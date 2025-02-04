import * as React from 'react';
import { ActionRow, AltButton, PriButton } from '../../control';
import { Divider, Stack, Typography } from '@mui/material';
import {
  IntellectualPropertyD,
  ISharedStrings,
  MediaFileD,
  Organization,
} from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
import {
  findRecord,
  orgDefaultVoices,
  related,
  useOrgDefaults,
} from '../../crud';
import SpeakerName from '../../components/SpeakerName';
import { useGlobal } from '../../context/GlobalContext';
import { useOrbitData } from '../../hoc/useOrbitData';

interface ISelectVoice {
  refresh?: () => void;
  onOpen: () => void;
  begin?: (voice: string) => () => Promise<void>;
}

export default function SelectVoice({ refresh, onOpen, begin }: ISelectVoice) {
  const [voice, setVoice] = React.useState<string>();
  const [org] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const ipRecs = useOrbitData<IntellectualPropertyD[]>('intellectualproperty');
  const { getDefault, setDefault } = useOrgDefaults();
  const t: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const team = React.useMemo(() => {
    return findRecord(memory, 'organization', org) as Organization;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  React.useEffect(() => {
    if (team) {
      const voices = getDefault(orgDefaultVoices, team);
      if (voices) {
        setVoice(voices?.voice);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  const statement = React.useMemo(() => {
    const found = ipRecs.filter(
      (r) =>
        r.attributes.rightsHolder === voice &&
        related(r, 'organization') === team.id
    );
    for (const ipRec of found) {
      const mediaRec = findRecord(
        memory,
        'mediafile',
        related(ipRec, 'releaseMediafile')
      ) as MediaFileD;
      if (mediaRec?.attributes?.transcription) {
        return mediaRec.attributes.transcription;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, team]);

  const handleSetVoice = (voice: string) => {
    setVoice(voice);
    const settings = getDefault(orgDefaultVoices, team);
    setDefault(orgDefaultVoices, { ...settings, voice }, team);
    refresh?.();
  };

  return (
    <Stack sx={{ minWidth: 120, pt: 2 }} spacing={2}>
      <SpeakerName
        name={voice ?? ''}
        onChange={handleSetVoice}
        team={team.id}
        recordingRequired
      />
      <Typography>{statement}</Typography>
      <Divider sx={{ m: 1 }} />
      <ActionRow>
        <AltButton onClick={onOpen}>{t.cancel}</AltButton>
        <PriButton onClick={begin?.(voice as string)} disabled={!voice}>
          {'Begin Conversion'}
        </PriButton>
      </ActionRow>
    </Stack>
  );
}
