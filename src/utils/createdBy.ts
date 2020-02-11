import Memory from '@orbit/memory';
import { QueryBuilder } from '@orbit/data';
import { User } from '../model';

export function getCreatedBy(userId: string | undefined, memory: Memory) {
  if (!userId || userId === '') return '';
  const userRec = memory.cache.query((q: QueryBuilder) =>
    q.findRecord({ type: 'user', id: userId })
  ) as User;
  return userRec.attributes.name;
}

export default getCreatedBy;
