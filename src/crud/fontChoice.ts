import { ArtifactTypeD, OrgWorkflowStep, Project } from '../model';
// import { dataPath, PathType } from '../utils/dataPath';
// import { isElectron } from '../api-variable';
import { getFamily, getRtl } from 'mui-language-picker';
import Memory from '@orbit/memory';
import { findRecord } from './tryFindRecord';

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
  // if (isElectron) {
  //   let local = await dataPath('http', PathType.FONTS, {
  //     localname: fontFamily + '.css',
  //   });
  //   if (local && !local.startsWith('http')) {
  //     if (await ipc?.exists(local)) {
  //       url = (await ipc?.isWindows())
  //         ? new URL(local).toString().slice(8)
  //         : local;
  //       url = `transcribe-safe://${url}`;
  //     }
  //   }
  // }
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
  const data: FontData = {
    langTag,
    spellCheck: false,
    fontFamily,
    fontSize: 'large',
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
