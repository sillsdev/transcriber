import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { ProjectD, RoleNames } from '../model';
import { UpdateRecord } from '../model/baseModel';
import { findRecord } from './tryFindRecord';
import { useJsonParams } from '../utils/useJsonParams';

export const projDefExportNumbers = 'exportNumbers';
export const projDefSectionMap = 'sectionMap';
export const projDefBook = 'book';
export const projDefHidePublishing = 'hidePublishing';
export const projDefFirstMovement = 'firstMovement';
export const projDefFilterParam = 'ProjectFilter';

export const useProjectDefaults = () => {
  const [project] = useGlobal('project');
  const [orgRole] = useGlobal('orgRole');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [offline] = useGlobal('offline');
  const { getParam, setParam, willSetParam } = useJsonParams();

  const getProjectDefault = (label: string, proj?: ProjectD) => {
    if (!proj) proj = findRecord(memory, 'project', project) as ProjectD;
    return getParam(label, proj?.attributes?.defaultParams);
  };

  const setProjectDefault = (label: string, value: any) => {
    const proj = findRecord(memory, 'project', project) as ProjectD;
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
  const getLocalDefault = (label: string) => {
    var str = localStorage.getItem(label + project);
    if (str) return JSON.parse(str);
    return undefined;
  };
  const setLocalDefault = (label: string, value: any) => {
    if (value) localStorage.setItem(label + project, JSON.stringify(value));
    else localStorage.removeItem(label + project);
  };
  return {
    getProjectDefault,
    setProjectDefault,
    canSetProjectDefault,
    getLocalDefault,
    setLocalDefault,
  };
};
