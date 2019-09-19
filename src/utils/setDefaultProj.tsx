import Memory from '@orbit/memory';
import { QueryBuilder } from '@orbit/data';
import { Project } from '../model';
import { related } from './related';

export const setDefaultProj = async (
  orgId: string,
  memory: Memory,
  setProject: (value: string) => void
) => {
  let projs: Project[] | null = (await memory.cache.query((q: QueryBuilder) =>
    q.findRecords('project')
  )) as any;
  projs =
    projs &&
    projs
      .filter(p => related(p, 'organization') === orgId && p.attributes)
      .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1));
  if (projs && projs.length > 0) {
    setProject(projs[0].id);
  }
};
