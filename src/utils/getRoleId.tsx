import { Role } from '../model';

export const getRoleId = (roles: Role[], role: string) =>
  roles
    .filter(r => r.attributes.roleName.toLowerCase() === role)
    .map(r => r.id);

export default getRoleId;
