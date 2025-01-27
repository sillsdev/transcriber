import React from 'react';
import { IAsrState } from '../business/asr/AsrAlphabet';
import { OrganizationD, OrgWorkflowStepD } from '../model';
import { orgDefaultAsr, useOrgDefaults } from './useOrgDefaults';
import { useTeamUpdate } from './useTeamUpdate';
import { useGlobal } from '../context/GlobalContext';
import { findRecord } from './tryFindRecord';
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

export function useGetAsrSettings() {
  const orgSteps = useOrbitData<OrgWorkflowStepD[]>('orgworkflowstep');
  const [team, setTeam] = React.useState<OrganizationD>();
  const [memory] = useGlobal('memory');
  const [org] = useGlobal('organization');
  const [user] = useGlobal('user');
  const { getDefault, setDefault } = useOrgDefaults();
  const teamUpdate = useTeamUpdate();
  const ctx = React.useContext(PassageDetailContext);
  const currentstep = ctx?.state?.currentstep;
  const [artId, setArtId] = React.useState('');
  const [artState, setArtState] = React.useState<IAsrState>();

  React.useEffect(() => {
    if (org) {
      setTeam(findRecord(memory, 'organization', org) as OrganizationD);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  React.useEffect(() => {
    const step = orgSteps.find((s) => s.id === currentstep);
    const json = JSONParse(step?.attributes?.tool ?? '{}');
    const settings = JSONParse(json?.settings ?? '{}');
    setArtId(settings?.artifactTypeId ?? '');
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
    setArtState(state);
  }, [orgSteps, currentstep]);

  const getAsrSettings = React.useCallback(() => {
    if (!artId) {
      return (team ? getDefault(orgDefaultAsr, team) : {}) as IAsrState;
    }
    return artState;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, artId, artState]);

  const setAsrSettings = React.useCallback(
    (asrState: IAsrState) => {
      if (!artId) {
        if (team) setDefault(orgDefaultAsr, asrState, team);
      } else {
        setArtState(asrState);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [team]
  );

  const saveAsrSettings = React.useCallback(() => {
    if (!artId) {
      if (team) teamUpdate(team);
    } else {
      const step = orgSteps.find((s) => s.id === currentstep);
      if (!step) return;
      const json = JSONParse(step?.attributes?.tool ?? '{}');
      const settings = JSONParse(json?.settings ?? '{}');
      // settings.artifactTypeId = artId;
      settings.language = `${artState?.language.languageName}|${artState?.language.bcp47}`;
      settings.font = artState?.language.font;
      settings.rtl = artState?.language.rtl;
      // if (artState?.target === AsrTarget.alphabet) {
      //   settings.mmsIso = artState.mmsIso;
      //   settings.dialect = artState.dialect;
      //   settings.selectRoman = artState.selectRoman;
      // }
      json.settings = JSON.stringify(settings);
      step.attributes.tool = JSON.stringify(json);
      memory.update((t) => UpdateRecord(t, step, user));
    }
    if (team) teamUpdate(team);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, teamUpdate, artId, artState, currentstep, orgSteps, user]);

  return { getAsrSettings, setAsrSettings, saveAsrSettings };
}
