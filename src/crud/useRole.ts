import React from 'react';
import { useGlobal } from 'reactn';
import { Role, Project, RoleNames } from '../model';
import { QueryBuilder, Record } from '@orbit/data';
import { related } from '../crud';

export const useRole = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProjRole] = useGlobal('projRole');

  interface IUniqueRoles {
    [key: string]: Role;
  }

  const roles = React.useMemo(() => {
    const uniqueRoles = {} as IUniqueRoles;
    const allRoles = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('role')
    ) as Role[];
    allRoles.forEach((r) => {
      if (offlineOnly !== Boolean(r?.keys?.remoteId)) {
        if (r?.attributes?.roleName) uniqueRoles[r.attributes.roleName] = r;
      }
    });
    return Object.values(uniqueRoles);
  }, [offlineOnly, memory]);

  const getRoleId = function (role: RoleNames): string {
    let findit = roles.filter(
      (r) => r.attributes && r.attributes.roleName === role
    );
    if (findit.length > 0) return findit[0].id;
    return '';
  };

  const getRoleRec = (kind: string, orgRole: boolean) => {
    const lcKind = kind.toLowerCase();
    return orgRole
      ? roles.filter(
          (r) =>
            r.attributes.orgRole &&
            r.attributes.roleName &&
            r.attributes.roleName.toLowerCase() === lcKind
        )
      : roles.filter(
          (r) =>
            r.attributes.groupRole &&
            r.attributes.roleName &&
            r.attributes.roleName.toLowerCase() === lcKind
        );
  };

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

  return {
    getRoleId,
    getRoleRec,
    getMbrRoleRec,
    setMyOrgRole,
    setMyProjRole,
    getMyOrgRole,
    getMyProjRole,
  };
};
