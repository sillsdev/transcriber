import { TransformBuilder } from '@orbit/data';
import { useGlobal, useMemo } from 'reactn';
import { Project, RoleNames } from '../model';
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
    if (json[label]) return JSON.parse(json[label]);
    return undefined;
  };
  const setProjectDefault = (label: string, value: any) => {
    const proj = findRecord(memory, 'project', project) as Project;
    const json = JSON.parse(proj.attributes.defaultParams ?? '{}');
    json[label] = JSON.stringify(value);
    proj.attributes.defaultParams = JSON.stringify(json);
    memory.update((t: TransformBuilder) => UpdateRecord(t, proj, user));
  };

  const canSetProjectDefault = useMemo(
    () => orgRole === RoleNames.Admin && (offlineOnly || !offline),
    [offline, offlineOnly, orgRole]
  );

  return { getProjectDefault, setProjectDefault, canSetProjectDefault };
};
