import React from 'react';
import { MmsLang } from '../../model/mmsLang';
// import MmsLangList from '../../assets/mmsLangs';
import { TokenContext } from '../../context/TokenProvider';
import { axiosGet } from '../../utils/axios';

const mmsLangs = new Map<string, MmsLang[]>();

export const useMmsLangs = () => {
  const token = React.useContext(TokenContext).state.accessToken ?? '';

  React.useEffect(() => {
    if ((token ?? '') !== '')
      axiosGet('aero/transcription/languages', undefined, token).then(
        (response: MmsLang[]) => {
          // const response = MmsLangList;
          response.forEach((lang: MmsLang) => {
            if (lang.is_mms_asr) {
              if (mmsLangs.has(lang.iso)) {
                const list = mmsLangs.get(lang.iso) as MmsLang[];
                if (!list.find((l) => l.mms_asr_code === lang.mms_asr_code)) {
                  list?.push(lang);
                  mmsLangs.set(lang.iso, list);
                }
              } else {
                mmsLangs.set(lang.iso, [lang]);
              }
            }
          });
        }
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return mmsLangs;
};
