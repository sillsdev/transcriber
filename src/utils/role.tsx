import { Role, RoleNames } from '../model';

export const getRoleId = function (roles: Role[], role: RoleNames): string {
  let findit = roles.filter(
    (r) => r.attributes && r.attributes.roleName === role
  );
  if (findit.length > 0) return findit[0].id;
  return '';
};

export default getRoleId;

// export const IsAdmin = function(roles: Role[], id: string): boolean {
//   let findit = roles.filter(r => r.id === id);
//   if (findit.length > 0)
//     return (
//       findit[0].attributes.roleName === RoleNames.Admin ||
//       findit[0].attributes.roleName === RoleNames.SuperAdmin
//     );
//   return false;
// };
