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
} from '@mui/material';
import { ISharedStrings } from '../../model';
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
  refresh?: () => void;
  onOpen: () => void;
}

export default function SelectAsrLanguage({
  refresh,
  onOpen,
}: ISelectAsrLanguage) {
  const [asrState, setAsrState] = React.useState<IAsrState>();
  const mmsLangs = useMmsLangs();
  const t: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { getAsrSettings, setAsrSettings, saveAsrSettings } =
    useGetAsrSettings();

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
      setAsrSettings(asrState);
      saveAsrSettings();
      refresh?.();
    }
    onOpen();
  };

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
          label="Phonetic"
          title={'Language choice is used to suggest word breaks'}
          sx={{ ml: 2 }}
        />
      </Stack>
      <Divider sx={{ pt: 2 }} />
      <ActionRow>
        <AltButton onClick={onOpen}>{t.cancel}</AltButton>
        <PriButton
          onClick={handleSave}
          disabled={
            !asrState?.target ||
            (asrState?.target === 'Alphabet' &&
              (asrState?.language?.bcp47 === undefined ||
                asrState?.language?.bcp47 === 'und'))
          }
        >
          {t.save}
        </PriButton>
      </ActionRow>
    </StyledBox>
  );
}
