import { User } from '../model';
import Memory from '@orbit/memory';
import { QueryBuilder } from '@orbit/data';

export function userAvatar(user: User) {
  return user.attributes.avatarUrl || undefined;
}

export function getUserById(users: User[], id: string): User {
  let findit = users.filter(u => u.id === id);
  if (findit.length > 0) return findit[0];
  //to avoid typescript issues for a case that won't happen
  return {} as User;
}

export function GetUser(memory: Memory, user: string): User {
  const userRec: User[] = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('user')
  ) as any;
  return getUserById(userRec, user);
}
