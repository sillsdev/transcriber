import { LangTag } from 'mui-language-picker';
import { MmsLang } from '../../model/mmsLang';

interface IMmsAsrDetail {
  mmsLang: MmsLang;
  langTag: LangTag | undefined;
  scriptName: Map<string, string>;
}

export const mmsAsrDetail = ({
  mmsLang,
  langTag,
  scriptName,
}: IMmsAsrDetail) => {
  let detail = '';
  let showRoman = false;
  const terms = mmsLang?.mms_asr_code?.slice(4)?.split('_');
  if (terms) {
    if (terms[0] === 'script') {
      detail += `Script: ${terms[1]}`;
      showRoman = terms[1] !== 'latin';
    } else if (terms[0] === 'dialect') {
      detail += `Dialect: ${terms[1]}`;
    }
  } else {
    if (!['Latn', 'Zyyy'].includes(langTag?.script ?? '')) {
      detail += `Script: ${scriptName.get(langTag?.script ?? '')} [${
        langTag?.script ?? ''
      }]`;
      showRoman = true;
    }
  }
  return { detail, showRoman };
};
