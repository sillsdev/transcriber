import { useState, useEffect, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { User, Group, GroupMembership } from '../../model';
import { PermissionName, related, useAllUserGroup, useUser } from '../../crud';

export interface IUserName {
  userId: string;
  name: string;
}

interface IProps {
  users: User[];
  groups: Group[];
  memberships: GroupMembership[];
}

export const usePeerGroups = ({ users, groups, memberships }: IProps) => {
  const [organization] = useGlobal('organization');
  const allUsersGroup = useAllUserGroup();
  const { getUserRec } = useUser();
  const [userNames, setUserNames] = useState<IUserName[]>([]);
  const [peerGroups, setPeerGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [check, setCheck] = useState<Set<string>>();
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');

  const cKey = (userId: string, groupId: string) => `${userId}_${groupId}`;

  const allUserId = useMemo(
    () => allUsersGroup(organization)?.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organization]
  );

  useEffect(() => {
    const memberIds = memberships
      .filter((m) => related(m, 'group') === allUserId)
      .map((m) => related(m, 'user'));

    setUserNames(
      memberIds.map((id) => {
        const userRec = getUserRec(id) as User;
        return { userId: id, name: userRec?.attributes?.name };
      })
    );
    var groupIds = memberships
      .filter((m) => related(m, 'user') === user)
      .map((om) => related(om, 'group'));
    setMyGroups(
      groups.filter(
        (g) =>
          !g.attributes.allUsers &&
          groupIds.includes(g.id) &&
          related(g, 'owner') === organization
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberships, organization, users]);

  useEffect(() => {
    const newCols = groups.filter(
      (g) => !g.attributes.allUsers && related(g, 'owner') === organization
    );
    setPeerGroups(newCols);
  }, [groups, organization]);

  useEffect(() => {
    const users = userNames.map((r) => r.userId);
    const grps = peerGroups.map((c) => c.id);
    const checks = new Set<string>();
    memberships.forEach((m) => {
      const u = related(m, 'user');
      const g = related(m, 'group');
      if (users.includes(u) && grps.includes(g)) checks.add(cKey(u, g));
    });
    setCheck(checks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNames, peerGroups]);

  const getGroupId = function (name: string): string {
    let findit = groups.filter(
      (r) =>
        r.attributes &&
        r.attributes.name === name &&
        offlineOnly === Boolean(r?.keys?.remoteId)
    );
    if (findit.length > 0) return findit[0].id;
    return '';
  };

  const citGroup = useMemo(
    () =>
      peerGroups.filter((g) =>
        g.attributes.permissions?.includes(PermissionName.CIT)
      ).length > 0
        ? peerGroups.filter((g) =>
            g.attributes.permissions?.includes(PermissionName.CIT)
          )[0]
        : undefined,
    [peerGroups]
  );
  const mentorGroup = useMemo(
    () =>
      peerGroups.filter((g) =>
        g.attributes.permissions?.includes(PermissionName.Mentor)
      ).length > 0
        ? peerGroups.filter((g) =>
            g.attributes.permissions?.includes(PermissionName.Mentor)
          )[0]
        : undefined,
    [peerGroups]
  );
  return {
    userNames,
    peerGroups,
    check,
    setCheck,
    cKey,
    myGroups,
    getGroupId,
    citGroup,
    mentorGroup,
  };
};
