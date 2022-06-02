import { GroupMembership } from '../model';
import { TransformBuilder } from '@orbit/data';
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
  memory.schema.initializeRecord(groupMemberRec);
  await memory.update((t: TransformBuilder) => [
    ...AddRecord(t, groupMemberRec, user, memory),
    ...ReplaceRelatedRecord(t, groupMemberRec, 'user', 'user', user),
    ...ReplaceRelatedRecord(t, groupMemberRec, 'group', 'group', group),
    ...ReplaceRelatedRecord(t, groupMemberRec, 'role', 'role', role),
  ]);
  return groupMemberRec;
}
