import { useGlobal } from 'reactn';
import { TransformBuilder } from '@orbit/data';
import { User, OrganizationMembership, GroupMembership } from '../model';
import { useRole, allUsersRec } from '.';
import { AddRecord } from '../model/baseModel';

export const useAddToOrgAndGroup = () => {
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const { getRoleRec } = useRole();

  return (userRec: User, newRec: boolean) => {
    const addMemberships = () => {
      let orgMember: OrganizationMembership = {
        type: 'organizationmembership',
      } as any;
      const memberRec = getRoleRec('member', true);
      const allUsersGroup = allUsersRec(memory, organization);
      const editorRec = getRoleRec('editor', false);
      let groupMbr: GroupMembership = {
        type: 'groupmembership',
      } as any;
      memory.update((t: TransformBuilder) => [
        ...AddRecord(t, orgMember, user, memory),
        t.replaceRelatedRecord(orgMember, 'user', userRec),
        t.replaceRelatedRecord(orgMember, 'organization', {
          type: 'organization',
          id: organization,
        }),
        t.replaceRelatedRecord(orgMember, 'role', memberRec[0]),
      ]);
      memory.update((t: TransformBuilder) => [
        ...AddRecord(t, groupMbr, user, memory),
        t.replaceRelatedRecord(groupMbr, 'user', userRec),
        t.replaceRelatedRecord(groupMbr, 'group', allUsersGroup[0]),
        t.replaceRelatedRecord(groupMbr, 'role', editorRec[0]),
      ]);
    };
    if (newRec) {
      memory
        .update((t: TransformBuilder) => AddRecord(t, userRec, user, memory))
        .then(addMemberships);
    } else {
      addMemberships();
    }
  };
};
