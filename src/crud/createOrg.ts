import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import {
  Organization,
  Role,
  OrganizationMembership,
  Group,
  GroupMembership,
  IApiError,
} from '../model';
import Coordinator from '@orbit/coordinator';
import { QueryBuilder, TransformBuilder, RecordIdentity } from '@orbit/data';
import { setDefaultProj, getRoleRec, allUsersRec } from '.';
import { AddRecord } from '../model/baseModel';

export const ReloadOrgTables = async (coordinator: Coordinator) => {
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  await remote
    .pull((q) => q.findRecords('organization'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('organizationmembership'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('group'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('groupmembership'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('user'))
    .then((transform) => memory.sync(transform));
};

const OrgRelated = async (
  coordinator: Coordinator,
  orgRec: Organization,
  userRecId: RecordIdentity
) => {
  const memory = coordinator.getSource('memory') as Memory;

  let orgMember: OrganizationMembership = {
    type: 'organizationmembership',
    attributes: {
    },
  } as OrganizationMembership;
  let groupMbr: GroupMembership = {
    type: 'groupmembership',
    attributes: {
    },} as GroupMembership;

  const roleRecs = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('role')
  ) as Role[];
  const orgRoleRec = getRoleRec(roleRecs, 'admin', true);
  const grpRoleRec = getRoleRec(roleRecs, 'admin', false);
  const allUsersGroup = allUsersRec(memory, orgRec.id);
  if (allUsersGroup.length === 0) {
    let group: Group = {
      type: 'group',
      attributes: {
        name: `All users of ${orgRec.attributes.name}`,
        abbreviation: `all-users`,
        allUsers: true,
      },
    } as Group;
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, group, userRecId.id, memory),
      t.replaceRelatedRecord(group, 'owner', orgRec),
    ]);
    allUsersGroup.push(group);
  }
    await memory.update((t: TransformBuilder) => [
    ...AddRecord(t, orgMember, userRecId.id, memory),
    t.replaceRelatedRecord(orgMember, 'user', userRecId),
    t.replaceRelatedRecord(orgMember, 'organization', orgRec),
    t.replaceRelatedRecord(orgMember, 'role', orgRoleRec[0]),
  ]);
  await memory.update((t: TransformBuilder) => [
    ...AddRecord(t, groupMbr, userRecId.id, memory),
    t.replaceRelatedRecord(groupMbr, 'user', userRecId),
    t.replaceRelatedRecord(groupMbr, 'group', allUsersGroup[0]),
    t.replaceRelatedRecord(groupMbr, 'role', grpRoleRec[0]),
  ]);
};

export interface ICreateOrgProps {
  orgRec: Organization;
  user: string;
  coordinator: Coordinator;
  online: boolean;
  offlineOnly: boolean;
  setOrganization: (id: string) => void;
  setProject: (id: string) => void;
  setProjectType: (id: string) => string;
  doOrbitError: (ex: IApiError) => void;
}

export const createOrg = async (props: ICreateOrgProps) => {
  const { orgRec, user, coordinator } = props;
  const { setOrganization, setProject, setProjectType} = props;

  const memory = coordinator.getSource('memory') as Memory;
  const userRecId = { type: 'user', id: user };

  await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, orgRec, user, memory),
      t.replaceRelatedRecord(orgRec, 'owner', userRecId),
    ]);
    await OrgRelated(coordinator, orgRec, userRecId);

  setOrganization(orgRec.id);
  setDefaultProj(orgRec.id, memory, setProject, setProjectType);
  return orgRec.id;
};

export default createOrg;
