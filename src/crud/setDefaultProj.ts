import Memory from '@orbit/memory';
import { QueryBuilder } from '@orbit/data';
import { Project } from '../model';
import { related } from './related';
import { remoteIdGuid } from '.';

export const setDefaultProj = async (
  orgId: string,
  memory: Memory,
  setProject: (value: string) => void,
  setProjectType: (projectId: string) => string
) => {
  let projs: Project[] | null = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('project')
  ) as any;
  projs =
    projs &&
    projs
      .filter((p) => related(p, 'organization') === orgId && p.attributes)
      .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1));
  if (projs && projs.length > 0) {
    let projKey =
      remoteIdGuid(
        'project',
        localStorage.getItem('lastProj') || '',
        memory.keyMap
      ) || '';
    var p = projs.find((p) => p.id === projKey) || projs[0];
    setProject(p.id);
    setProjectType(p.id);
  }
};
