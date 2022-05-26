import { useState, useEffect, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { User, GroupMembership, Group } from '../../model';
import { related, useAllUserGroup, useUser } from '../../crud';

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
  const [check, setCheck] = useState<Set<string>>();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberships, organization, users, allUserId]);

  useEffect(() => {
    const newCols = groups.filter(
      (g) => g?.id !== allUserId && related(g, 'owner') === organization
    );
    setPeerGroups(newCols);
  }, [groups, organization, allUserId]);

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

  return { userNames, peerGroups, check, setCheck, cKey };
};
