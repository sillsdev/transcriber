import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { Project, ProjectD, RoleNames } from '../model';
import { UpdateRecord } from '../model/baseModel';
import { findRecord } from './tryFindRecord';

export const useProjectDefaults = () => {
  const [project] = useGlobal('project');
  const [orgRole] = useGlobal('orgRole');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [offline] = useGlobal('offline');

  const getProjectDefault = (label: string) => {
    const proj = findRecord(memory, 'project', project) as Project;
    const json = JSON.parse(proj?.attributes.defaultParams ?? '{}');
    if (json.hasOwnProperty(label)) return JSON.parse(json[label]);
    return undefined;
  };
  const setProjectDefault = (label: string, value: any) => {
    const proj = findRecord(memory, 'project', project) as ProjectD;
    const json = JSON.parse(proj.attributes.defaultParams ?? '{}');
    if (value !== undefined) json[label] = JSON.stringify(value);
    else delete json[label];
    proj.attributes.defaultParams = JSON.stringify(json);
    memory.update((t) => UpdateRecord(t, proj, user));
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
