import Memory from '@orbit/memory';
import { KeyMap, QueryBuilder } from '@orbit/data';
import { User } from '../model';
import { remoteIdGuid } from '.';

export function getCreatedBy(
  createdBy: number,
  memory: Memory,
  keyMap: KeyMap
) {
  if (createdBy <= 0) return '';
  const userId = remoteIdGuid('user', createdBy.toString(), keyMap);
  const userRec = memory.cache.query((q: QueryBuilder) =>
    q.findRecord({ type: 'user', id: userId })
  ) as User;
  return userRec.attributes.name;
}

export default getCreatedBy;
