import * as React from 'react';
import {
  ActionRow,
  AltButton,
  GrowingSpacer,
  ILanguage,
  Language,
  Options,
  PriButton,
} from '../../control';
import {
  styled,
  Box,
  BoxProps,
  Divider,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { NoShowAgain } from '../../control/NoShowAgain';
import { ISharedStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
import { getLangTag } from 'mui-language-picker';
import { axiosGet } from '../../utils/axios';
import { useContext } from 'react';
import { TokenContext } from '../../context/TokenProvider';
import { MmsLang } from '../../model/mmsLang';
import scriptNameData from '../../assets/scriptName';

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  '& * > .MuiBox-root': {
    display: 'inline-flex',
    alignItems: 'center',
  },
}));

const initLang = {
  bcp47: 'und',
  languageName: '',
  font: '',
  rtl: false,
  spellCheck: false,
};

interface IDecorations {
  [key: string]: JSX.Element;
}

interface ISelectAsrLanguage {
  onOpen: () => void;
}

export default function SelectAsrLanguage({ onOpen }: ISelectAsrLanguage) {
  const [target, setTarget] = React.useState<string>();
  const [decorations, setDecorations] = React.useState<IDecorations>({});
  const [selectRoman, setSelectRoman] = React.useState(false);
  const [showAgain, setShowAgain] = React.useState(false);
  const mmsLangs = React.useRef<Map<string, MmsLang>>(new Map());
  const [language, setLanguage] = React.useState<ILanguage>({ ...initLang });
  const t: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const token = useContext(TokenContext).state.accessToken ?? '';
  const [scriptName] = React.useState(
    new Map(scriptNameData as [string, string][])
  );

  const options = ['Alphabet', 'Phonetic'];

  const handleFilter = (code: string) => {
    const langTag = getLangTag(code);
    if (['Zxxx', 'Sgnw', 'Brai'].includes(langTag?.script ?? '')) return false;
    return mmsLangs.current.has(langTag?.iso639_3 ?? 'und');
  };

  React.useEffect(() => {
    if ((token ?? '') !== '')
      axiosGet('aero/transcription/languages', undefined, token).then(
        (response: MmsLang[]) => {
          response.forEach((lang: MmsLang) => {
            if (lang.is_mms_asr) mmsLangs.current.set(lang.iso, lang);
          });
        }
      );
  }, [token]);

  React.useEffect(() => {
    const langTag = getLangTag(language.bcp47);
    const mmsLang = mmsLangs.current.get(langTag?.iso639_3 ?? 'und');
    const terms = mmsLang?.mms_asr_code?.slice(4)?.split('_');
    let detail = '';
    let showRoman = false;
    if (terms) {
      if (terms[0] === 'script') {
        detail = `Script: ${terms[1]}`;
        showRoman = terms[1] !== 'latin';
      } else if (terms[0] === 'dialect') {
        detail = `Dialect: ${terms[1]}`;
      }
    } else {
      if (!['Latn', 'Zyyy'].includes(langTag?.script ?? '')) {
        detail = `Script: ${scriptName.get(langTag?.script ?? '')} [${
          langTag?.script ?? ''
        }]`;
        showRoman = true;
      }
    }
    setDecorations({
      Alphabet: (
        <Stack direction="row" spacing={1} sx={{ mx: 1 }}>
          <Language
            {...language}
            onChange={setLanguage}
            filter={handleFilter}
            hideSpelling={true}
            hideFont={true}
            disabled={target !== 'Alphabet'}
          />
          <Stack direction="column">
            <Typography>{detail}</Typography>
            {showRoman && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectRoman ?? false}
                    onChange={(_e, checked) =>
                      setSelectRoman && setSelectRoman(checked)
                    }
                    disabled={target !== 'Alphabet'}
                  />
                }
                label={'Transliterate to Latin script'}
              />
            )}
          </Stack>
        </Stack>
      ),
    });
  }, [language, selectRoman, target, scriptName]);

  return (
    <StyledBox sx={{ minWidth: 120 }}>
      <Options
        label={'Type of Transcription'}
        defaultValue={target}
        options={options}
        onChange={(option: string) => setTarget(option)}
        decorations={decorations}
      />
      <Divider sx={{ pt: 2 }} />
      <ActionRow>
        <NoShowAgain checked={showAgain} setChecked={setShowAgain} />
        <GrowingSpacer />
        <AltButton onClick={onOpen}>{t.cancel}</AltButton>
        <PriButton
          onClick={onOpen}
          disabled={
            !target || (target === 'Alphabet' && language.bcp47 === 'und')
          }
        >
          {t.save}
        </PriButton>
      </ActionRow>
    </StyledBox>
  );
}
