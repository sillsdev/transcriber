import { Project } from '../model';
import { dataPath, PathType } from '../utils';
import { isElectron } from '../api-variable';

export interface FontData {
  langTag: string;
  spellCheck: boolean;
  fontFamily: string;
  fontSize: string;
  fontDir: string;
  url: string;
  fontConfig: {
    custom: {
      families: string[];
      urls: string[];
    };
  };
}

export const getFontData = (r: Project, offline: boolean) => {
  const langTag = r?.attributes?.language;
  const spellCheck = r?.attributes?.spellCheck;
  const fontFamily = r?.attributes?.defaultFont
    ? r.attributes.defaultFont.split(',')[0].replace(/ /g, '')
    : 'CharisSIL';
  const fontSize = r?.attributes?.defaultFontSize
    ? r.attributes.defaultFontSize
    : 'large';
  const fontDir = r?.attributes?.rtl ? 'rtl' : 'ltr';
  const fileName = fontFamily + '.css';
  var url = 'https://s3.amazonaws.com/fonts.siltranscriber.org/' + fileName;
  if (isElectron) {
    var local = dataPath('http', PathType.FONTS, {
      localname: fileName,
    });
    if (local !== 'http') url = 'transcribe-safe://' + local;
  }
  const data: FontData = {
    langTag,
    spellCheck,
    fontFamily,
    fontSize,
    fontDir,
    url,
    fontConfig: {
      custom: {
        families: [fontFamily],
        urls: [url],
      },
    },
  };
  return data;
};
