import React from 'react';
import {
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { ILanguage, Language } from '../../control/Language';
import { getLangTag, LangTag } from 'mui-language-picker';
import { mmsAsrDetail } from './mmsAsrDetail';
import scriptNameData from '../../assets/scriptName';
import { MmsLang } from '../../model/mmsLang';

export interface IAsrState {
  target: string;
  language: ILanguage;
  mmsIso: string;
  dialect: string | undefined;
  selectRoman?: boolean;
}

interface IAsrAlphabet {
  state: IAsrState;
  setState: React.Dispatch<React.SetStateAction<IAsrState | undefined>>;
  mmsLangs: Map<string, MmsLang[]>;
}

export const AsrAlphabet = ({ state, setState, mmsLangs }: IAsrAlphabet) => {
  const [langTag, setLangTag] = React.useState<LangTag | undefined>();
  const [mmsLangMat, setMmsLangMat] = React.useState<MmsLang[]>();
  const [showRoman, setShowRoman] = React.useState(false);
  const init = React.useRef(true);
  const [scriptName] = React.useState(
    new Map(scriptNameData as [string, string][])
  );

  React.useEffect(() => {
    const newLangTag = getLangTag(state?.language?.bcp47);
    setLangTag(newLangTag);
    const newMatch = mmsLangs.get(newLangTag?.iso639_3 ?? 'und');
    setMmsLangMat(newMatch);
    setShowRoman(
      newMatch?.some(
        (mmsLang) =>
          mmsAsrDetail({ mmsLang, langTag: newLangTag, scriptName })?.showRoman
      ) ?? false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mmsLangs]);

  const handleChange = (event: any) => {
    setState({ ...state, dialect: event.target.value });
  };

  const handleFilter = (code: string) => {
    const langTag = getLangTag(code);
    if (['Zxxx', 'Sgnw', 'Brai'].includes(langTag?.script ?? '')) return false;
    if (langTag?.tag?.split('-')?.[0] === 'zh') return true;
    return mmsLangs.has(langTag?.iso639_3 ?? 'und');
  };

  const setLang = (language: ILanguage) => {
    if (init.current) {
      init.current = false;
      return;
    }
    let dialect = undefined;
    const langTag = getLangTag(language?.bcp47 ?? 'und');
    let mmsIso = langTag?.iso639_3 ?? 'und';
    if (langTag?.tag === 'zh-CN') mmsIso = 'cmn';
    const mmsLangMat = mmsLangs.get(mmsIso);
    if ((mmsLangMat?.length ?? 0) > 1) {
      dialect = mmsLangMat?.[0]?.mms_asr_code ?? '';
    }
    const selectRoman = false;
    setState({ ...state, language, mmsIso, dialect, selectRoman });
  };

  const handleRoman = (_event: any, checked: boolean) => {
    setState({ ...state, selectRoman: checked });
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mx: 1 }}>
      <Language
        {...state.language}
        onChange={setLang}
        filter={handleFilter}
        hideSpelling={true}
        hideFont={true}
      />
      <Stack direction="column">
        {mmsLangMat?.length === 1 ? (
          <Typography>
            {
              mmsAsrDetail({ mmsLang: mmsLangMat[0], langTag, scriptName })
                ?.detail
            }
          </Typography>
        ) : (mmsLangMat?.length ?? 0) > 1 ? (
          <FormControl sx={{ m: 1, minWidth: 200 }}>
            <InputLabel id="dialect-select-label">Script or Dialect</InputLabel>
            <Select
              labelId={'dialect-select-label'}
              id={'dialect-select'}
              value={state.dialect}
              label="Script or Dialect"
              onChange={handleChange}
            >
              {mmsLangMat?.map((mmsLang) => (
                <MenuItem
                  key={mmsLang?.mms_asr_code}
                  value={mmsLang?.mms_asr_code ?? ''}
                >
                  {mmsAsrDetail({ mmsLang, langTag, scriptName })?.detail}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <></>
        )}

        {showRoman && (
          <FormControlLabel
            control={
              <Checkbox
                checked={state.selectRoman ?? false}
                onChange={handleRoman}
                disabled={state.target !== 'Alphabet'}
              />
            }
            label={'Transliterate to Latin script'}
          />
        )}
      </Stack>
    </Stack>
  );
};
