import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { ProjectD, RoleNames } from '../model';
import { UpdateRecord } from '../model/baseModel';
import { findRecord } from './tryFindRecord';

export const useProjectDefaults = () => {
  const [project] = useGlobal('project');
  const [orgRole] = useGlobal('orgRole');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [offline] = useGlobal('offline');

  const getProjectDefault = (label: string, proj?: ProjectD) => {
    if (!proj) proj = findRecord(memory, 'project', project) as ProjectD;
    const json = JSON.parse(proj?.attributes.defaultParams ?? '{}');
    if (json.hasOwnProperty(label)) return JSON.parse(json[label]);
    return undefined;
  };

  const newProjectDefault = (
    defaultParams: string,
    label: string,
    value: any
  ) => {
    const json = JSON.parse(defaultParams ?? '{}');
    var saveIt = false;
    if (value !== undefined) {
      var tmp = JSON.stringify(value);
      if (tmp !== json[label]) {
        saveIt = true;
        json[label] = tmp;
      }
    } else if ((json[label] ?? '') !== '') {
      delete json[label];
      saveIt = true;
    }
    if (saveIt) {
      return JSON.stringify(json);
    }
  };
  const setProjectDefault = (label: string, value: any) => {
    const proj = findRecord(memory, 'project', project) as ProjectD;
    if (!proj || !proj.attributes) return;
    var newDefaultParams = newProjectDefault(
      proj.attributes.defaultParams,
      label,
      value
    );
    if (newDefaultParams) {
      proj.attributes.defaultParams = newDefaultParams;
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
    newProjectDefault,
    canSetProjectDefault,
    getLocalDefault,
    setLocalDefault,
  };
};
