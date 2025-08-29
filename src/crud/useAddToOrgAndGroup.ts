import { useGlobal } from '../context/GlobalContext';
import {
  User,
  RoleNames,
  OrganizationMembershipD,
  GroupMembershipD,
} from '../model';
import { useRole } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { useMemo } from 'react';
import useAllUsers from './useAllUsers';

export const useAddToOrgAndGroup = () => {
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');
  const allUsersRec = useAllUsers();
  const [user] = useGlobal('user');
  const { getRoleId } = useRole();

  const memberId = useMemo(() => getRoleId(RoleNames.Member), [getRoleId]);

  return (userRec: User, newRec: boolean) => {
    const addMemberships = () => {
      let orgMember: OrganizationMembershipD = {
        type: 'organizationmembership',
      } as any;
      const allUsersGroup = allUsersRec(organization);
      let groupMbr: GroupMembershipD = {
        type: 'groupmembership',
      } as any;
      memory.update((t) => [
        ...AddRecord(t, orgMember, user, memory),
        ...ReplaceRelatedRecord(t, orgMember, 'user', 'user', userRec.id),
        ...ReplaceRelatedRecord(
          t,
          orgMember,
          'organization',
          'organization',
          organization
        ),
        ...ReplaceRelatedRecord(t, orgMember, 'role', 'role', memberId),
      ]);
      memory.update((t) => [
        ...AddRecord(t, groupMbr, user, memory),
        ...ReplaceRelatedRecord(t, groupMbr, 'user', 'user', userRec.id),
        ...ReplaceRelatedRecord(
          t,
          groupMbr,
          'group',
          'group',
          allUsersGroup?.id
        ),
        ...ReplaceRelatedRecord(t, groupMbr, 'role', 'role', memberId),
      ]);
    };
    if (newRec) {
      memory
        .update((t) => AddRecord(t, userRec, user, memory))
        .then(addMemberships);
    } else {
      addMemberships();
    }
  };
};
