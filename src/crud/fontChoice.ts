import { ArtifactTypeD, OrgWorkflowStep, Project } from '../model';
// import { dataPath, PathType } from '../utils/dataPath';
// import { isElectron } from '../api-variable';
import { getFamily, getRtl } from 'mui-language-picker';
import Memory from '@orbit/memory';
import { findRecord } from './tryFindRecord';
import { LocalKey } from '../utils';

// const ipc = (window as any)?.electron;

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

const getFontKey = (key: string) => `${LocalKey.fontData}-${key}`;

export const loadFontData = (exportId: string): FontData | undefined => {
  const lastFont = localStorage.getItem(getFontKey(exportId));
  return lastFont ? JSON.parse(lastFont) : undefined;
};

export const saveFontData = async (data: FontData, exportId: string) => {
  localStorage.setItem(getFontKey(exportId), JSON.stringify(data));
};

export const getFontData = async (r: Project, artifactId?: string | null) => {
  // fontSize and spellCheck are set from last usage
  const lastFontData = loadFontData(artifactId ?? 'project');

  const langTag = r?.attributes?.language;
  const spellCheck = lastFontData?.spellCheck ?? r?.attributes?.spellCheck;
  const fontFamily = r?.attributes?.defaultFont
    ? r.attributes.defaultFont.split(',')[0].replace(/ /g, '')
    : 'CharisSIL';
  const fontSize =
    lastFontData?.fontSize ?? r?.attributes?.defaultFontSize ?? 'large';
  const fontDir = r?.attributes?.rtl || getRtl(langTag) ? 'rtl' : 'ltr';
  let url = getFontUrl(fontFamily);

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

export const getArtTypeFontData = (
  memory: Memory,
  exportId: string,
  orgSteps: OrgWorkflowStep[]
) => {
  const artifactType = findRecord(
    memory,
    'artifacttype',
    exportId
  ) as ArtifactTypeD;
  let stepSettings = { language: 'English|en', font: 'CharisSIL' };

  orgSteps?.find((s) => {
    const toolData = JSON.parse(s.attributes?.tool || '{}');
    if (toolData?.settings) {
      const settings = JSON.parse(toolData.settings);
      if (
        settings?.artifactTypeId ===
        (artifactType?.keys?.remoteId ?? artifactType?.id)
      ) {
        stepSettings = settings;
        return true;
      }
    }
    return false;
  });
  const [, langTag] = stepSettings?.language?.split('|') ?? [];
  const fontDir = getRtl(langTag) ? 'rtl' : 'ltr';
  const fontFamily = stepSettings?.font || 'CharisSIL';
  let url = getFontUrl(fontFamily);

  // fontSize and spellCheck are set from last usage
  const lastFontData = loadFontData(exportId);

  const data: FontData = {
    langTag,
    spellCheck: lastFontData?.spellCheck ?? false,
    fontFamily,
    fontSize: lastFontData?.fontSize ?? 'large',
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
