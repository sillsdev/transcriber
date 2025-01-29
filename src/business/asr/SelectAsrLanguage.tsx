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
import { ISharedStrings, OrganizationD } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
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
  onOpen: (cancal?: boolean) => void;
  canBegin?: boolean;
}

export default function SelectAsrLanguage({
  team,
  refresh,
  onOpen,
  canBegin,
}: ISelectAsrLanguage) {
  const [asrState, setAsrState] = React.useState<IAsrState>();
  const mmsLangs = useMmsLangs();
  const t: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { getAsrSettings, setAsrSettings, saveAsrSettings } =
    useGetAsrSettings(team);

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

  const handleSave = React.useCallback(() => {
    if (asrState) {
      setAsrSettings(asrState);
      saveAsrSettings();
      refresh?.();
    }
    onOpen();
  }, [asrState, setAsrSettings, saveAsrSettings, refresh, onOpen]);

  React.useEffect(() => {
    const asr = getAsrSettings();
    setAsrState({
      target: asr?.target ?? 'Alphabet',
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAsrSettings]);

  return (
    <StyledBox sx={{ minWidth: 120 }}>
      <Stack>
        <AsrAlphabet
          state={asrState ?? ({} as IAsrState)}
          setState={setAsrState}
          mmsLangs={mmsLangs}
        />
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
              title={'Language choice is used to suggest word breaks'}
            >
              Phonetic
            </Badge>
          }
          sx={{ ml: 2 }}
        />
      </Stack>
      <Divider sx={{ pt: 2 }} />
      <ActionRow>
        <AltButton onClick={() => onOpen(true)}>{t.cancel}</AltButton>
        <PriButton
          onClick={handleSave}
          disabled={
            !asrState?.target ||
            (asrState?.target === 'Alphabet' &&
              (asrState?.language?.bcp47 === undefined ||
                asrState?.language?.bcp47 === 'und'))
          }
        >
          {canBegin ? 'Begin Recognition' : t.save}
        </PriButton>
      </ActionRow>
    </StyledBox>
  );
}
