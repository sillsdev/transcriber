import { useGlobal } from 'reactn';
import { Role, Project } from '../model';
import { QueryBuilder, Record } from '@orbit/data';
import { related } from '../crud';

export const useRole = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProjRole] = useGlobal('projRole');

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

  const getMyOrgRole = (orgId: string) => {
    const gMbrRecs = getMbrRoleRec('organization', orgId, user);
    return getMbrRole(gMbrRecs);
  };

  const setMyOrgRole = (orgId: string) => {
    const role = getMyOrgRole(orgId);
    setOrgRole(role);
    return role;
  };

  const getMyProjRole = (projectId: string) => {
    if (projectId === '') return '';
    const proj = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'project', id: projectId })
    ) as Project;
    const gMbrRecs = getMbrRoleRec('group', related(proj, 'group'), user);
    return getMbrRole(gMbrRecs);
  };

  const setMyProjRole = (projectId: string) => {
    const role = getMyProjRole(projectId);
    setProjRole(role);
    return role;
  };

  return { setMyOrgRole, setMyProjRole, getMyOrgRole, getMyProjRole };
};
