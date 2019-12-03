import {
  Organization,
  Group,
  OrganizationMembership,
  GroupMembership,
  Role,
} from '../model';
import { TransformBuilder, QueryBuilder, Schema } from '@orbit/data';
import Memory from '@orbit/memory';

export const AddOrganization = (
  orgRec: Organization,
  user: string,
  schema: Schema,
  memory: Memory
) => {
  schema.initializeRecord(orgRec);

  let orgMbrRec: OrganizationMembership = {
    type: 'organizationmembership',
  } as any;
  schema.initializeRecord(orgRec);

  let groupRec: Group = {
    type: 'group',
    attributes: {
      name: 'All Users',
    },
  } as any;
  schema.initializeRecord(groupRec);

  let grpMbrRec: GroupMembership = {
    type: 'groupmembership',
  } as any;
  schema.initializeRecord(grpMbrRec);

  const adminRole = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('role').filter({ attribute: 'roleName', value: 'Admin' })
  ) as Role[];

  memory.update((t: TransformBuilder) => [
    t.addRecord(orgRec),
    t.replaceRelatedRecord(orgRec, 'owner', { type: 'user', id: user }),
    t.addRecord(orgMbrRec),
    t.replaceRelatedRecord(orgMbrRec, 'user', { type: 'user', id: user }),
    t.replaceRelatedRecord(orgMbrRec, 'organization', orgRec),
    t.replaceRelatedRecord(orgMbrRec, 'role', adminRole[0]),
    t.addRecord(groupRec),
    t.addRecord(grpMbrRec),
    t.replaceRelatedRecord(grpMbrRec, 'user', { type: 'user', id: user }),
    t.replaceRelatedRecord(grpMbrRec, 'group', groupRec),
    t.replaceRelatedRecord(grpMbrRec, 'role', adminRole[0]),
  ]);
};

export default AddOrganization;
