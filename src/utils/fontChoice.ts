import { Project } from '../model';
import { dataPath } from '.';
import path from 'path';

export interface FontData {
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
  const fontFamily = r?.attributes?.defaultFont
    ? r.attributes.defaultFont.split(',')[0].replace(/ /g, '')
    : 'CharisSIL';
  const fontSize = r?.attributes?.defaultFontSize
    ? r.attributes.defaultFontSize
    : 'large';
  const fontDir = r?.attributes?.rtl ? 'rtl' : 'ltr';
  const url = offline
    ? dataPath(path.join('fonts', fontFamily + '.css'))
    : 'https://s3.amazonaws.com/fonts.siltranscriber.org/' +
      fontFamily +
      '.css';
  const data: FontData = {
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
