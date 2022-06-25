import { useGlobal } from 'reactn';
import { TransformBuilder } from '@orbit/data';
import { User, OrganizationMembership, GroupMembership } from '../model';
import { useRole, allUsersRec } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

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
      const memberRec = getRoleRec('member', true)[0];
      const allUsersGroup = allUsersRec(memory, organization)[0];
      const editorRec = getRoleRec('editor', false)[0];
      let groupMbr: GroupMembership = {
        type: 'groupmembership',
      } as any;
      memory.update((t: TransformBuilder) => [
        ...AddRecord(t, orgMember, user, memory),
        ...ReplaceRelatedRecord(t, orgMember, 'user', 'user', userRec.id),
        ...ReplaceRelatedRecord(
          t,
          orgMember,
          'organization',
          'organization',
          organization
        ),
        ...ReplaceRelatedRecord(t, orgMember, 'role', 'role', memberRec.id),
      ]);
      memory.update((t: TransformBuilder) => [
        ...AddRecord(t, groupMbr, user, memory),
        ...ReplaceRelatedRecord(t, groupMbr, 'user', 'user', userRec.id),
        ...ReplaceRelatedRecord(t, groupMbr, 'group', 'role', allUsersGroup.id),
        ...ReplaceRelatedRecord(t, groupMbr, 'role', 'role', editorRec.id),
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
