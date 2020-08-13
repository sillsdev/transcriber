import { useGlobal } from 'reactn';
import { Role } from '../model';
import { QueryBuilder, Record } from '@orbit/data';
import { related } from '../utils';
import { useAllUserGroup } from '.';

export const useRole = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProjRole] = useGlobal('projRole');
  const allUserGroup = useAllUserGroup();

  const getMbrRoleRec = (relate: string, id: string, userId: string) => {
    const tableName =
      relate === 'group' ? 'groupmembership' : 'organizationmembership';
    const table = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(tableName)
    ) as Record[];
    return table.filter(
      (tbl) => related(tbl, 'user') === userId && related(tbl, relate) === id
    );
  };

  const getMbrRole = (memberRecs: Record[]) => {
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

  const setMyOrgRole = (orgId: string) => {
    const gMbrRecs = getMbrRoleRec('organization', orgId, user);
    const role = getMbrRole(gMbrRecs);
    setOrgRole(role);
    return role;
  };

  const setMyProjRole = (teamId: string) => {
    const allUsers = allUserGroup(teamId);
    const gMbrRecs = getMbrRoleRec('group', allUsers?.id, user);
    const role = getMbrRole(gMbrRecs);
    setProjRole(role);
    return role;
  };

  const result: Array<typeof setMyOrgRole | typeof setMyProjRole> = [
    setMyOrgRole,
    setMyProjRole,
  ];
  return result;
};
