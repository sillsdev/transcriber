import * as React from 'react';
import { ActionRow, AltButton, PriButton } from '../../control';
import {
  styled,
  Box,
  BoxProps,
  Divider,
  Stack,
  FormControlLabel,
  Checkbox,
  Badge,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import {
  ISharedStrings,
  ITranscriberStrings,
  OrganizationD,
} from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector, transcriberSelector } from '../../selector';
import { AsrAlphabet, IAsrState } from './AsrAlphabet';
import { useMmsLangs } from './useMmsLangs';
import { useGetAsrSettings } from '../../crud/useGetAsrSettings';

export enum AsrTarget {
  alphabet = 'Alphabet',
  phonetic = 'Phonetic',
}

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  '& * > .MuiBox-root': {
    display: 'inline-flex',
    alignItems: 'center',
  },
}));

interface ISelectAsrLanguage {
  team?: OrganizationD;
  refresh?: () => void;
  onOpen: (cancal?: boolean, force?: boolean) => void;
  canBegin?: boolean;
}

export default function SelectAsrLanguage({
  team,
  refresh,
  onOpen,
  canBegin,
}: ISelectAsrLanguage) {
  const [asrState, setAsrState] = React.useState<IAsrState>();
  const [asrStateIn, setAsrStateIn] = React.useState<IAsrState>();
  const mmsLangs = useMmsLangs();
  const t: ITranscriberStrings = useSelector(transcriberSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { getAsrSettings, saveAsrSettings, getArtId } = useGetAsrSettings(team);

  const handlePhonetic = () => {
    if (asrState)
      setAsrState({
        ...asrState,
        target:
          asrState.target === AsrTarget.phonetic
            ? AsrTarget.alphabet
            : AsrTarget.phonetic,
      });
  };

  const handleSave = () => {
    if (asrState) {
      saveAsrSettings(asrState);
      refresh?.();
    }
    onOpen(
      false,
      asrStateIn?.language.bcp47 !== asrState?.language.bcp47 ||
        asrStateIn?.selectRoman !== asrState?.selectRoman
    );
  };

  React.useEffect(() => {
    const asr = getAsrSettings();
    const defaultAsr = {
      target: asr?.target ?? AsrTarget.alphabet,
      language: asr?.language ?? {
        bcp47: 'und',
        languageName: '',
        font: 'charissil',
        rtl: false,
        spellCheck: false,
      },
      mmsIso: asr?.mmsIso ?? 'eng',
      dialect: asr?.dialect,
      selectRoman: asr?.selectRoman ?? false,
    };
    setAsrState({ ...defaultAsr });
    setAsrStateIn({ ...defaultAsr });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StyledBox sx={{ minWidth: 120 }}>
      <Stack>
        <AsrAlphabet
          state={asrState ?? ({} as IAsrState)}
          setState={setAsrState}
          mmsLangs={mmsLangs}
        />
        {!getArtId() && (
          <FormControlLabel
            control={
              <Checkbox
                checked={asrState?.target === AsrTarget.phonetic}
                onClick={handlePhonetic}
              />
            }
            label={
              <Badge
                badgeContent={<InfoIcon color={'info'} fontSize="small" />}
                title={t.phoneticTip}
              >
                {t.phonetic}
              </Badge>
            }
            sx={{ ml: 2 }}
          />
        )}
      </Stack>
      <Divider sx={{ pt: 2 }} />
      <ActionRow>
        <AltButton onClick={() => onOpen(true)}>{ts.cancel}</AltButton>
        <PriButton
          onClick={handleSave}
          disabled={
            !asrState?.target ||
            (asrState?.target === AsrTarget.alphabet &&
              (asrState?.language?.bcp47 === undefined ||
                asrState?.language?.bcp47 === 'und'))
          }
        >
          {canBegin ? t.beginRecognize : ts.save}
        </PriButton>
      </ActionRow>
    </StyledBox>
  );
}
