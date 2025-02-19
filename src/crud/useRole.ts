import React, { useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Role, RoleD, RoleNames, User } from '../model';
import { InitializedRecord } from '@orbit/records';
import { findRecord, related } from '../crud';
import { logError, Severity } from '../utils';
import { ReplaceRelatedRecord } from '../model/baseModel';

export const useRole = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly'); //verified this is not used in a function 2/18/25
  const [orgRole, setOrgRole] = useGlobal('orgRole'); //verified this is not used in a function 2/18/25
  const [errorReporter] = useGlobal('errorReporter');

  interface IUniqueRoles {
    [key: string]: RoleD;
  }

  const roles = React.useMemo(() => {
    const uniqueRoles = {} as IUniqueRoles;
    const allRoles = (
      memory?.cache.query((q) => q.findRecords('role')) as RoleD[]
    ).filter((r) => r.attributes.orgRole);
    allRoles.forEach((r) => {
      if (offlineOnly !== Boolean(r?.keys?.remoteId)) {
        if (r?.attributes?.roleName) uniqueRoles[r.attributes.roleName] = r;
      }
    });
    return Object.values(uniqueRoles);
  }, [offlineOnly, memory]);

  const userIsAdmin = useMemo(() => {
    return orgRole === RoleNames.Admin;
  }, [orgRole]);

  const userIsSharedContentAdmin = useMemo(() => {
    var userRec = findRecord(memory, 'user', user) as User;
    return userRec?.attributes?.sharedContentAdmin;
  }, [memory, user]);

  const userIsSharedContentCreator = useMemo(() => {
    var userRec = findRecord(memory, 'user', user) as User;
    return (
      userRec?.attributes?.sharedContentAdmin ||
      userRec?.attributes?.sharedContentCreator
    );
  }, [memory, user]);

  const userIsOrgAdmin = (orgId: string) =>
    getMyOrgRole(orgId) === RoleNames.Admin;

  const getRoleRec = (role: RoleNames) =>
    roles.filter(
      (r) =>
        r.attributes.orgRole &&
        r.attributes.roleName &&
        r.attributes.roleName.toLowerCase() === role.toLowerCase()
    );

  const getRoleId = function (role: RoleNames): string {
    let findit = getRoleRec(role);
    if (findit.length > 0) return findit[0].id;
    return '';
  };

  const getMbrRoleRec = (relate: string, id: string, userId: string) => {
    const tableName = 'organizationmembership';
    const table = memory?.cache.query((q) =>
      q.findRecords(tableName)
    ) as InitializedRecord[];
    return table.filter(
      (tbl) => related(tbl, 'user') === userId && related(tbl, relate) === id
    );
  };

  const getMbrRole = (memberRecs: InitializedRecord[]) => {
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
        memory.update((t) => [
          ...ReplaceRelatedRecord(t, memberRecs[0], 'role', 'role', roleId),
        ]);
      }
      const roleRec = memory?.cache.query((q) =>
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

  const setMyOrgRole = useMemo(
    () => (orgId: string) => {
      const role = getMyOrgRole(orgId);
      if (role !== orgRole) setOrgRole(role);
      return role;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgRole]
  );

  return {
    getRoleId,
    getRoleRec,
    getMbrRoleRec,
    setMyOrgRole,
    getMyOrgRole,
    userIsAdmin,
    userIsOrgAdmin,
    userIsSharedContentAdmin,
    userIsSharedContentCreator,
  };
};
