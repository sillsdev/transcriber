import { Role, RoleNames } from '../model';
import Memory from '@orbit/memory';
import { QueryBuilder, Record } from '@orbit/data';
import { related } from '.';

export const getRoleId = function (roles: Role[], role: RoleNames): string {
  let findit = roles.filter(
    (r) => r.attributes && r.attributes.roleName === role
  );
  if (findit.length > 0) return findit[0].id;
  return '';
};

export const getRoleRec = (
  roleRecs: Role[],
  kind: string,
  orgRole: boolean
) => {
  const lcKind = kind.toLowerCase();
  return orgRole
    ? roleRecs.filter(
        (r) =>
          r.attributes.orgRole &&
          r.attributes.roleName &&
          r.attributes.roleName.toLowerCase() === lcKind
      )
    : roleRecs.filter(
        (r) =>
          r.attributes.groupRole &&
          r.attributes.roleName &&
          r.attributes.roleName.toLowerCase() === lcKind
      );
};

export const getMbrRoleRec = (
  memory: Memory,
  relate: string,
  id: string,
  userId: string
) => {
  const tableName =
    relate === 'group' ? 'groupmembership' : 'organizationmembership';
  const table = memory.cache.query((q: QueryBuilder) =>
    q.findRecords(tableName)
  ) as Record[];
  return table.filter(
    (tbl) => related(tbl, 'user') === userId && related(tbl, relate) === id
  );
};

export const getMbrRole = (memory: Memory, memberRecs: Record[]) => {
  if (memberRecs.length === 1) {
    const roleId = related(memberRecs[0], 'role');
    const roleRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'role', id: roleId })
    ) as Role;
    const roleName = roleRec?.attributes?.roleName;
    if (roleName) return roleName.toLocaleLowerCase();
  }
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
