import { Project } from '../model';
import { dataPath, PathType } from '../utils/dataPath';
import { isElectron } from '../api-variable';

const ipc = (window as any)?.electron;

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

export const getFontData = async (r: Project, offline: boolean) => {
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
    let local = dataPath('http', PathType.FONTS, {
      localname: fileName,
    });
    if (local && !local.startsWith('http')) {
      if (await ipc?.exists(local)) {
        url = (await ipc?.isWindows())
          ? new URL(local).toString().slice(8)
          : local;
        url = `transcribe-safe://${url}`;
      }
    }
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
