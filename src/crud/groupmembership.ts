import { GroupMembership, GroupMembershipD } from '../model';
import MemorySource from '@orbit/memory';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

export async function addGroupMember(
  memory: MemorySource,
  group: string,
  user: string,
  role: string
) {
  let groupMemberRec: GroupMembership;
  groupMemberRec = {
    type: 'groupmembership',
  } as any;
  await memory.update((t) => [
    ...AddRecord(t, groupMemberRec, user, memory),
    ...ReplaceRelatedRecord(
      t,
      groupMemberRec as GroupMembershipD,
      'user',
      'user',
      user
    ),
    ...ReplaceRelatedRecord(
      t,
      groupMemberRec as GroupMembershipD,
      'group',
      'group',
      group
    ),
    ...ReplaceRelatedRecord(
      t,
      groupMemberRec as GroupMembershipD,
      'role',
      'role',
      role
    ),
  ]);
  return groupMemberRec;
}
