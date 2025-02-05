import React from 'react';
import { IAsrState } from '../business/asr/AsrAlphabet';
import { OrganizationD, OrgWorkflowStepD } from '../model';
import { orgDefaultAsr, useOrgDefaults } from './useOrgDefaults';
import { useGlobal } from '../context/GlobalContext';
import { PassageDetailContext } from '../context/PassageDetailContext';
import { useOrbitData } from '../hoc/useOrbitData';
import { JSONParse } from '../utils';
import { getLangTag } from 'mui-language-picker';
import { UpdateRecord } from '../model/baseModel';

const asrDefault: IAsrState = {
  target: 'Alphabet',
  language: {
    bcp47: 'und',
    languageName: 'English',
    font: 'charissil',
    rtl: false,
    spellCheck: false,
  },
  mmsIso: 'eng',
  dialect: undefined,
  selectRoman: false,
};

export function useGetAsrSettings(team?: OrganizationD) {
  const orgSteps = useOrbitData<OrgWorkflowStepD[]>('orgworkflowstep');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  const ctx = React.useContext(PassageDetailContext);
  const currentstep = ctx?.state?.currentstep;

  const getArtId = () => {
    const step = orgSteps.find((s) => s.id === currentstep);
    const json = JSONParse(step?.attributes?.tool ?? '{}');
    const settings = JSONParse(json?.settings ?? '{}');
    return settings?.artifactTypeId ?? '';
  };

  const getWorkflowAsrState = () => {
    const step = orgSteps.find((s) => s.id === currentstep);
    const json = JSONParse(step?.attributes?.tool ?? '{}');
    const settings = JSONParse(json?.settings ?? '{}');
    if (!settings?.artifactTypeId || !settings) return asrDefault;
    const [languageName, bcp47] = settings?.language?.split('|') ?? ['', 'und'];
    const font = settings?.font ?? asrDefault.language.font;
    const rtl = settings?.rtl ?? asrDefault.language.rtl;
    const langTag = getLangTag(bcp47);
    const mmsIso = langTag?.iso639_3 ?? 'und';
    const state = {
      ...asrDefault,
      mmsIso,
      language: { ...asrDefault.language, languageName, bcp47, font, rtl },
    };
    return state;
  };

  const getAsrSettings = () => {
    if (!getArtId()) {
      return getOrgDefault(orgDefaultAsr, team?.id) as IAsrState;
    }
    return getWorkflowAsrState();
  };

  const saveAsrSettings = (asrState: IAsrState) => {
    if (!getArtId()) {
      setOrgDefault(orgDefaultAsr, asrState, team?.id);
    } else {
      const step = orgSteps.find((s) => s.id === currentstep);
      if (!step) return;
      const json = JSONParse(step?.attributes?.tool ?? '{}');
      const settings = JSONParse(json?.settings ?? '{}');
      // settings.artifactTypeId = artId;
      settings.language = `${asrState?.language.languageName}|${asrState?.language.bcp47}`;
      settings.font = asrState?.language.font;
      settings.rtl = asrState?.language.rtl;
      // if (asrState?.target === AsrTarget.alphabet) {
      //   settings.mmsIso = asrState.mmsIso;
      //   settings.dialect = asrState.dialect;
      //   settings.selectRoman = asrState.selectRoman;
      // }
      json.settings = JSON.stringify(settings);
      step.attributes.tool = JSON.stringify(json);
      memory.update((t) => UpdateRecord(t, step, user));
    }
  };

  return { getAsrSettings, saveAsrSettings };
}
