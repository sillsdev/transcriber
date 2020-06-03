import { Group } from '../model';
import Memory from '@orbit/memory';
import { QueryBuilder } from '@orbit/data';
import { related } from '.';

export const allUsersRec = (memory: Memory, orgId: string) => {
  const groups = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('group')
  ) as Group[];
  return groups.filter(
    (g) => related(g, 'owner') === orgId && g.attributes.allUsers
  );
};

export default allUsersRec;
