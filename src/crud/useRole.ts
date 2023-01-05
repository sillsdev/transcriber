import React from 'react';
import { useGlobal } from '../mods/reactn';
import { Role, RoleNames } from '../model';
import { QueryBuilder, Record, TransformBuilder } from '@orbit/data';
import { related } from '../crud';
import { logError, Severity } from '../utils';
import { ReplaceRelatedRecord } from '../model/baseModel';

export const useRole = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [orgRole, setOrgRole] = useGlobal('orgRole');
  const [errorReporter] = useGlobal('errorReporter');

  interface IUniqueRoles {
    [key: string]: Role;
  }

  const roles = React.useMemo(() => {
    const uniqueRoles = {} as IUniqueRoles;
    const allRoles = (
      memory.cache.query((q: QueryBuilder) => q.findRecords('role')) as Role[]
    ).filter((r) => r.attributes.orgRole);
    allRoles.forEach((r) => {
      if (offlineOnly !== Boolean(r?.keys?.remoteId)) {
        if (r?.attributes?.roleName) uniqueRoles[r.attributes.roleName] = r;
      }
    });
    return Object.values(uniqueRoles);
  }, [offlineOnly, memory]);

  const userIsAdmin = React.useMemo(() => {
    return orgRole === RoleNames.Admin;
  }, [orgRole]);

  const userIsOrgAdmin = (orgId: string) =>
    getMyOrgRole(orgId) === RoleNames.Admin;

  const getRoleId = function (role: RoleNames): string {
    let findit = getRoleRec(role);
    if (findit.length > 0) return findit[0].id;
    return '';
  };

  const getRoleRec = (role: RoleNames) =>
    roles.filter(
      (r) =>
        r.attributes.orgRole &&
        r.attributes.roleName &&
        r.attributes.roleName.toLowerCase() === role.toLowerCase()
    );

  const getMbrRoleRec = (relate: string, id: string, userId: string) => {
    const tableName = 'organizationmembership';
    const table = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(tableName)
    ) as Record[];
    return table.filter(
      (tbl) => related(tbl, 'user') === userId && related(tbl, relate) === id
    );
  };

  const getMbrRole = (memberRecs: Record[]) => {
    if (memberRecs.length === 1) {
      var roleId = related(memberRecs[0], 'role');
      if (!roleId) {
        //default to Admin
        logError(
          Severity.error,
          errorReporter,
          `missing role:${memberRecs[0].keys?.remoteId}`
        );
        roleId = getRoleId(RoleNames.Admin);
        memory.update((t: TransformBuilder) => [
          ...ReplaceRelatedRecord(t, memberRecs[0], 'role', 'role', roleId),
        ]);
      }
      const roleRec = memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'role', id: roleId })
      ) as Role;

      const roleName = roleRec?.attributes?.roleName;
      if (roleName) return roleName as RoleNames;
    }
    return undefined;
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

  return {
    getRoleId,
    getRoleRec,
    getMbrRoleRec,
    setMyOrgRole,
    getMyOrgRole,
    userIsAdmin,
    userIsOrgAdmin,
  };
};
