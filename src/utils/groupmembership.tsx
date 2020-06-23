import { GroupMembership } from '../model';
import { TransformBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';

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
    t.addRecord(groupMemberRec),
    t.replaceRelatedRecord(
      { type: 'groupmembership', id: groupMemberRec.id },
      'user',
      { type: 'user', id: user }
    ),
    t.replaceRelatedRecord(
      { type: 'groupmembership', id: groupMemberRec.id },
      'group',
      { type: 'group', id: group }
    ),
    t.replaceRelatedRecord(
      { type: 'groupmembership', id: groupMemberRec.id },
      'role',
      { type: 'role', id: role }
    ),
  ]);
  return groupMemberRec;
}
