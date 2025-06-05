import * as React from 'react';
import { ActionRow, AltButton, PriButton } from '../../control';
import { Divider, Stack, Typography } from '@mui/material';
import {
  IntellectualPropertyD,
  ISharedStrings,
  IVoiceStrings,
  MediaFileD,
} from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector, voiceSelector } from '../../selector';
import {
  findRecord,
  orgDefaultVoices,
  related,
  useOrgDefaults,
} from '../../crud';
import SpeakerName from '../../components/SpeakerName';
import { useGlobal } from '../../context/GlobalContext';
import { useOrbitData } from '../../hoc/useOrbitData';
import { IVoicePerm } from './PersonalizeVoicePermission';

interface ISelectVoice {
  noNewVoice?: boolean;
  onlySettings?: boolean;
  onOpen: () => void;
  begin?: () => void;
  refresh?: () => void;
}

export default function SelectVoice({
  noNewVoice,
  onlySettings = false,
  onOpen,
  begin,
  refresh,
}: ISelectVoice) {
  const [voice, setVoice] = React.useState<string>();
  const [rights, setRights] = React.useState<boolean>(false);
  const [memory] = useGlobal('memory');
  const [org] = useGlobal('organization');
  const ipRecs = useOrbitData<IntellectualPropertyD[]>('intellectualproperty');
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  const t: IVoiceStrings = useSelector(voiceSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  React.useEffect(() => {
    const curVoice = getOrgDefault(orgDefaultVoices)?.fullName;
    if (curVoice) {
      setVoice(curVoice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statement = React.useMemo(() => {
    const found = ipRecs.filter(
      (r) =>
        r?.attributes?.rightsHolder === voice &&
        related(r, 'organization') === org
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
  }, [voice, org]);

  const handleSetVoice = (voice: string) => {
    setVoice(voice);
    const state = getOrgDefault(orgDefaultVoices) as IVoicePerm;
    setOrgDefault(orgDefaultVoices, { ...state, fullName: voice });
    refresh?.();
  };

  return (
    <Stack sx={{ minWidth: 120, pt: 2 }} spacing={2}>
      <SpeakerName
        name={voice ?? ''}
        noNewVoice={noNewVoice}
        onChange={handleSetVoice}
        onRights={(hasRights) => setRights(hasRights)}
        recordingRequired
      />
      <Typography>{statement}</Typography>
      <Divider sx={{ m: 1 }} />
      <ActionRow>
        <AltButton onClick={onOpen}>
          {onlySettings ? ts.close : ts.cancel}
        </AltButton>
        {!onlySettings && (
          <PriButton onClick={begin} disabled={!voice || !rights}>
            {t.convert}
          </PriButton>
        )}
      </ActionRow>
    </Stack>
  );
}
