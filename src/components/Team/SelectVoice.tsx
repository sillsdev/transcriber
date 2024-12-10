import * as React from 'react';
import {
  ActionRow,
  AltButton,
  GrowingSpacer,
  Options,
  PriButton,
} from '../../control';
import MediaTitle from '../../control/MediaTitle';
import {
  styled,
  Box,
  BoxProps,
  Divider,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { NoShowAgain } from '../../control/NoShowAgain';
import { ISharedStrings, Organization } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
import BigDialog from '../../hoc/BigDialog';
import PersonalizeVoicePermission, {
  IPermission,
} from './PersonalizeVoicePermission';

const sponsorOrg = 'SIL Global';

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  '& * > * > .MuiBox-root': {
    display: 'flex',
    alignItems: 'baseline',
  },
}));

interface IVoiceDefine {
  voiceRange: string;
  titleMediafile: string;
  titlex: string;
  anyRecording: boolean;
  passageId?: string;
  onRecording: (recording: boolean) => void;
  onTextChange: (value: string) => string;
  onMediaIdChange: (mediaId: string) => void;
  planId: string;
}

function VoiceDefine({
  voiceRange,
  titleMediafile,
  titlex,
  anyRecording,
  passageId,
  onRecording,
  onTextChange,
  onMediaIdChange,
  planId,
}: IVoiceDefine) {
  return (
    <MediaTitle
      titlekey={`voice-${voiceRange}`}
      label={'\u200B'} // zero-width space
      mediaId={titleMediafile}
      title={titlex}
      defaultFilename={`${voiceRange}.wav`}
      onTextChange={onTextChange}
      onRecording={onRecording}
      useplan={planId}
      onMediaIdChange={onMediaIdChange}
      disabled={anyRecording}
      passageId={passageId}
    />
  );
}

interface IDecorations {
  [key: string]: JSX.Element;
}

const options = ['Bass', 'Tenor', 'Alto', 'Soprano', 'Mezzo', 'Baritone'];

interface ISelectVoice {
  team?: Organization;
  onOpen: () => void;
}

export default function SelectVoice({ team, onOpen }: ISelectVoice) {
  const [voice, setVoice] = React.useState<string>();
  const [allOptions, setAllOptions] = React.useState<string[]>(options);
  const [decorations, setDecorations] = React.useState<IDecorations>({});
  const [showPermission, setShowPermission] = React.useState(false);
  const [showPersonalize, setShowPersonalize] = React.useState<IPermission>();
  const [showAgain, setShowAgain] = React.useState(false);
  const [permState, setPermState] = React.useState<IPermission>({});
  const [permStatement, setPermStatement] = React.useState('');
  const t: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  function handleChange(option: string): void {
    if (!options.includes(option)) {
      setAllOptions([...options]);
    }
    setVoice(option);
  }

  function handlePersonalize() {
    setPermState((state) => ({
      ...state,
      sponsor: sponsorOrg,
      team: team?.attributes.name,
    }));
    setShowPersonalize(permState);
  }

  React.useEffect(() => {
    const obj: IDecorations = {};
    allOptions.forEach((option) => {
      obj[option] = (
        <VoiceDefine
          voiceRange={option}
          titleMediafile={''}
          titlex={''}
          anyRecording={false}
          passageId={''}
          onRecording={() => {}}
          onTextChange={() => ''}
          onMediaIdChange={() => {}}
          planId={''}
        />
      );
    });
    setDecorations({ ...obj });
  }, [allOptions]);

  React.useEffect(() => {
    const cats = [];
    if (permState?.gender)
      cats.push(`my gender is ${permState.gender ?? 'not going to be given'}`);
    if (permState?.age) cats.push(`my age is ${permState.age ?? 'not given'}`);
    const catMsg =
      cats.length > 0
        ? `To aid in categorizing my voice for use, ${cats.join(' and ')}.`
        : '';
    const langPl =
      (permState?.languages?.indexOf(' ') ?? -1) >= 0
        ? 'THe languages that I speak are'
        : 'The language I speak is';

    const langUse =
      permState?.scope === 'All teams'
        ? `${catMsg} I understand that ${
            permState?.sponsor ?? sponsorOrg
          } will only use my voice with languages I do not regularly use, to prevent impersonation. ${langPl} ${
            permState?.languages ?? 'English'
          }.`
        : `I understand the my voice can be used by the ${team?.attributes.name} team for any or all of its projects on audio files for the vernacular language, navigation language or any back translation languages.`;
    setPermStatement(
      `I ${permState?.fullName ?? ''} provide consent for ${
        permState?.sponsor ?? sponsorOrg
      } to record and store this file with my voice in a voice library for AI applications that require a voice sample, including voice conversion. The recording created by ${
        permState?.sponsor ?? sponsorOrg
      } of me reading this script will become the exclusive property of ${
        permState.sponsor ?? sponsorOrg
      } which shall have the unlimited right to make, have made, use, copy, display in public, reconstruct, repair, modify, reproduce, publish, distribute and sell the Work Product, in whole or in part, or combine the Work Product with other matter, or not use the Work Product at all, as it sees fit. ${
        permState?.sponsor ?? sponsorOrg
      } will use the recording in a variety of ways, including, but not limited to, Audio books, narrating apps, and scripture engagement to further the mission of the organization. ${langUse} I have been provided this script in a language I understand, and have been given the option to request this script in a language of my choice. This recording will act as my signature in place of a written agreement. I understand that I will not be compensated for the use of my voice. I sign with my voice, ${
        permState?.fullName ?? 'but choose not to be identified by name'
      }.`
    );
  }, [permState, team]);

  return (
    <StyledBox sx={{ minWidth: 120 }}>
      <Stack direction="row" spacing={1} sx={{ mx: 1 }}>
        <Options
          label={
            <>
              Voice
              <IconButton onClick={() => setShowPermission(!showPermission)}>
                <InfoIcon fontSize="small" color="primary" />
              </IconButton>
            </>
          }
          defaultValue={voice}
          options={allOptions}
          onChange={handleChange}
          // addOption={
          //   allOptions.length === options.length ? handleAddOption : undefined
          // }
          otherLabel={'Other'}
          decorations={decorations}
        />
        {showPermission && (
          <Stack direction="column" spacing={1} sx={{ mx: 1 }}>
            <Typography variant="body2" sx={{ py: 2 }} component={'div'}>
              Record this permission statement if you agree:
              <Typography sx={{ lineHeight: '1.2rem' }}>
                {permStatement}
              </Typography>
            </Typography>
            <ActionRow>
              <AltButton onClick={handlePersonalize}>{'Personalize'}</AltButton>
              <AltButton onClick={() => setShowPermission(false)}>
                {t.close}
              </AltButton>
            </ActionRow>
          </Stack>
        )}
      </Stack>
      <Divider sx={{ pt: 2 }} />
      <ActionRow>
        <NoShowAgain checked={showAgain} setChecked={setShowAgain} />
        <GrowingSpacer />
        <AltButton onClick={onOpen}>{t.cancel}</AltButton>
        <PriButton onClick={onOpen}>{t.save}</PriButton>
      </ActionRow>
      <BigDialog
        title={'Personalize Voice Permission'}
        isOpen={Boolean(showPersonalize)}
        onOpen={() => setShowPersonalize(undefined)}
        onCancel={() => {
          setPermState(showPersonalize as IPermission);
          setShowPersonalize(undefined);
        }}
        onSave={() => setShowPersonalize(undefined)}
      >
        <PersonalizeVoicePermission state={permState} setState={setPermState} />
      </BigDialog>
    </StyledBox>
  );
}
