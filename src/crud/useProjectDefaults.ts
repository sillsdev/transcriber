import { useMemo } from 'react';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { ProjectD, RoleNames } from '../model';
import { UpdateRecord } from '../model/baseModel';
import { findRecord } from './tryFindRecord';
import { useJsonParams } from '../utils/useJsonParams';
import { tryParseJSON } from '../utils/tryParseJson';

export const projDefExportNumbers = 'exportNumbers';
export const projDefSectionMap = 'sectionMap';
export const projDefBook = 'book';
export const projDefStory = 'story';
export const projDefFirstMovement = 'firstMovement';
export const projDefFilterParam = 'ProjectFilter';

export const useProjectDefaults = () => {
  const [orgRole] = useGlobal('orgRole'); //verified this is not used in a function 2/18/25
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly'); //verified this is not used in a function 2/18/25
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const { getParam, setParam, willSetParam } = useJsonParams();
  const getGlobal = useGetGlobal();

  const getProjectDefault = (label: string, proj?: ProjectD) => {
    if (!proj)
      proj = findRecord(memory, 'project', getGlobal('project')) as ProjectD;
    return getParam(label, proj?.attributes?.defaultParams);
  };

  const setProjectDefault = (label: string, value: any, projIn?: ProjectD) => {
    const proj =
      projIn ||
      (findRecord(memory, 'project', getGlobal('project')) as ProjectD);
    if (!proj || !proj.attributes) return;
    if (willSetParam(label, value, proj.attributes.defaultParams)) {
      proj.attributes.defaultParams = setParam(
        label,
        value,
        proj.attributes.defaultParams
      );
      memory.update((t) => UpdateRecord(t, proj, user));
    }
  };

  const canSetProjectDefault = useMemo(
    () => orgRole === RoleNames.Admin && (offlineOnly || !offline),
    [offline, offlineOnly, orgRole]
  );
  const getLocalDefault = (label: string, projId?: string) => {
    var str = localStorage.getItem(label + (projId ?? getGlobal('project')));
    if (str) {
      var ret = tryParseJSON(str);
      if (ret !== false) return ret;
      return str;
    }
    return undefined;
  };
  const setLocalDefault = (label: string, value: any) => {
    if (value)
      localStorage.setItem(label + getGlobal('project'), JSON.stringify(value));
    else localStorage.removeItem(label + getGlobal('project'));
  };
  return {
    getProjectDefault,
    setProjectDefault,
    canSetProjectDefault,
    getLocalDefault,
    setLocalDefault,
  };
};
