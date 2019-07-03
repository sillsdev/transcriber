import { User } from '../model';

export function userInitials(user: User) {
  return (
    (user.attributes.givenName || user.attributes.name || '  ').slice(0, 1) +
    (user.attributes.familyName || '  ').slice(0, 1)
  );
}
export function userAvatar(user: User) {
  return user.attributes.avatarUrl || undefined;
}
