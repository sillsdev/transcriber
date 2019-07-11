import { User } from '../model';

export function userAvatar(user: User) {
  return user.attributes.avatarUrl || undefined;
}
