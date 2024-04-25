import { Project } from '../model';
import { dataPath, PathType } from '../utils/dataPath';
import { isElectron } from '../api-variable';
import { getFamily, getRtl } from 'mui-language-picker';

const ipc = (window as any)?.electron;

export interface IFontConfig {
  custom: {
    families: string[];
    urls: string[];
  };
}

export interface FontData {
  langTag: string;
  spellCheck: boolean;
  fontFamily: string;
  fontSize: string;
  fontDir: string;
  url: string;
  fontConfig: IFontConfig;
}

export const getFontUrl = (fontFamily: string) => {
  const fontData = getFamily(fontFamily);
  const fontDefault =
    fontData?.defaults?.woff2 ||
    fontData?.defaults?.woff ||
    fontData?.defaults?.ttf;
  return fontDefault
    ? fontData?.files?.[fontDefault]?.flourl ??
        fontData?.files?.[fontDefault]?.url ??
        ''
    : '';
};

export const getFontData = async (r: Project, offline: boolean) => {
  const langTag = r?.attributes?.language;
  const spellCheck = r?.attributes?.spellCheck;
  const fontFamily = r?.attributes?.defaultFont
    ? r.attributes.defaultFont.split(',')[0].replace(/ /g, '')
    : 'CharisSIL';
  const fontSize = r?.attributes?.defaultFontSize
    ? r.attributes.defaultFontSize
    : 'large';
  const fontDir = r?.attributes?.rtl || getRtl(langTag) ? 'rtl' : 'ltr';
  let url = getFontUrl(fontFamily);
  if (isElectron) {
    let local = await dataPath('http', PathType.FONTS, {
      localname: fontFamily + '.css',
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
