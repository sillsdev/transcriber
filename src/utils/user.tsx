import { User } from '../model';

export function userAvatar(user: User) {
  return user.attributes.avatarUrl || undefined;
}

export function getUserById(users: User[], id: string): User {
  let findit = users.filter(u => u.id === id);
  if (findit.length > 0) return findit[0];
  //to avoid typescript issues for a case that won't happen
  return {} as User;
}
