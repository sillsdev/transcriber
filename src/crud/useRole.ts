import React from 'react';
import { useGlobal } from 'reactn';
import {
  Role,
  Project,
  RoleNames,
  canTranscribe,
  canBeEditor,
  ISharedStrings,
  Group,
} from '../model';
import { QueryBuilder, Record, TransformBuilder } from '@orbit/data';
import { related } from '../crud';
import { localizeRole, logError, Severity } from '../utils';
import { ReplaceRelatedRecord } from '../model/baseModel';

export const useRole = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [, setOrgRole] = useGlobal('orgRole');
  const [projRole, setProjRole] = useGlobal('projRole');
  const [errorReporter] = useGlobal('errorReporter');

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
  const getTranscriberRoleIds = () => {
    return canTranscribe.map((rn) => getRoleId(rn));
  };
  const getEditorRoleIds = () => {
    return canBeEditor.map((rn) => getRoleId(rn));
  };
  const getLocalizedTranscriberRoles = (ts: ISharedStrings) => {
    return canTranscribe.map((rn) => localizeRole(rn, ts, true));
  };
  const getLocalizedEditorRoles = (ts: ISharedStrings) => {
    return canBeEditor.map((rn) => localizeRole(rn, ts, true));
  };

  const userCanTranscribe = () =>
    projRole ? canTranscribe.includes(projRole) : false;
  const userCanBeEditor = () =>
    projRole ? canBeEditor.includes(projRole) : false;
  const userIsProjAdmin = () => projRole === RoleNames.Admin;

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

  const getMyProjRole = (projectId: string) => {
    if (!projectId || projectId === '') return '';
    try {
      const proj = memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'project', id: projectId })
      ) as Project;

      const gMbrRecs = getMbrRoleRec('group', related(proj, 'group'), user);
      return getMbrRole(gMbrRecs);
    } catch {
      return RoleNames.Admin;
    }
  };

  const getInviteProjRole = (orgId: string) => {
    try {
      const groups = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('group')
      ) as Group[];
      const allUsersGroup = groups.filter(
        (g) => g.attributes.allUsers && related(g, 'owner') === orgId
      );
      const gMbrRecs = getMbrRoleRec('group', allUsersGroup[0].id, user);
      return getMbrRole(gMbrRecs);
    } catch {
      return RoleNames.Admin;
    }
  };

  const setMyProjRole = (projectId: string) => {
    const role = getMyProjRole(projectId);
    setProjRole(role as RoleNames);
    return role as RoleNames;
  };

  return {
    getRoleId,
    getRoleRec,
    getMbrRoleRec,
    setMyOrgRole,
    setMyProjRole,
    getMyOrgRole,
    getMyProjRole,
    getInviteProjRole,
    getTranscriberRoleIds,
    getEditorRoleIds,
    getLocalizedTranscriberRoles,
    getLocalizedEditorRoles,
    userCanTranscribe,
    userCanBeEditor,
    userIsProjAdmin,
  };
};
