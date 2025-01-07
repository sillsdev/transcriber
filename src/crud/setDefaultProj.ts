import Memory from '@orbit/memory';
import { Project } from '../model';
import { related } from './related';
import { remoteIdGuid } from '.';
import { RecordKeyMap } from '@orbit/records';

export const setDefaultProj = async (
  orgId: string,
  memory: Memory,
  cb: (pId: string) => void
) => {
  let projs: Project[] | null = memory.cache.query((q) =>
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
        memory?.keyMap as RecordKeyMap
      ) || '';
    var p = projs.find((p) => p.id === projKey) || projs[0];
    cb(p.id as string);
  }
};
