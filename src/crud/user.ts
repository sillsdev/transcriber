import { User } from '../model';
import Memory from '@orbit/memory';
import { QueryBuilder } from '@orbit/data';
import { localeDefault } from '../utils';
import * as actions from '../store';

export function getUserById(users: User[], id: string): User {
  let findit = users.filter((u) => u.id === id);
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

export function SetUserLanguage(memory: Memory, user: string, setLanguage: typeof actions.setLanguage)
{
  var userrec = GetUser(memory, user);
  setLanguage(
    userrec.attributes?.locale
      ? userrec.attributes?.locale
      : localeDefault(false)
  );
}
