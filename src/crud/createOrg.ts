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
import { orbitErr } from '../utils';

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
  } as any;
  memory.schema.initializeRecord(orgMember);
  let groupMbr: GroupMembership = {
    type: 'groupmembership',
  } as any;
  memory.schema.initializeRecord(groupMbr);

  const roleRecs = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('role')
  ) as Role[];
  const memberRec = getRoleRec(roleRecs, 'member', true);
  const editorRec = getRoleRec(roleRecs, 'editor', false);
  const allUsersGroup = allUsersRec(memory, orgRec.id);
  if (allUsersGroup.length === 0) {
    let group: Group = {
      type: 'group',
      attributes: {
        name: `All users of ${orgRec.attributes.name}`,
        abbreviation: `all-users`,
        allUsers: true,
      },
    } as any;
    memory.schema.initializeRecord(group);
    await memory.update((t: TransformBuilder) => [
      t.addRecord(group),
      t.replaceRelatedRecord(group, 'owner', orgRec),
    ]);
    allUsersGroup.push(group);
  }
  await memory.update((t: TransformBuilder) => [
    t.addRecord(orgMember),
    t.replaceRelatedRecord(orgMember, 'user', userRecId),
    t.replaceRelatedRecord(orgMember, 'organization', orgRec),
    t.replaceRelatedRecord(orgMember, 'role', memberRec[0]),
  ]);
  await memory.update((t: TransformBuilder) => [
    t.addRecord(groupMbr),
    t.replaceRelatedRecord(groupMbr, 'user', userRecId),
    t.replaceRelatedRecord(groupMbr, 'group', allUsersGroup[0]),
    t.replaceRelatedRecord(groupMbr, 'role', editorRec[0]),
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
  doOrbitError: (ex: IApiError) => void;
}

export const createOrg = async (props: ICreateOrgProps) => {
  const { orgRec, user, coordinator, online, offlineOnly } = props;
  const { setOrganization, setProject, doOrbitError } = props;

  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  memory.schema.initializeRecord(orgRec);

  const userRecId = { type: 'user', id: user };

  if (offlineOnly) {
    await memory.update((t: TransformBuilder) => [
      t.addRecord(orgRec),
      t.replaceRelatedRecord(orgRec, 'owner', userRecId),
    ]);
    await OrgRelated(coordinator, orgRec, userRecId);
  } else if (!remote || !online) {
    throw new Error('Creating an Org is not available offline');
  } else {
    await remote
      .update((t: TransformBuilder) => [
        t.addRecord(orgRec),
        t.replaceRelatedRecord(orgRec, 'owner', userRecId),
      ])
      .catch((err: Error) => {
        var x = orbitErr(err, 'CreateOrg');
        doOrbitError(x);
        console.log(err.message);
      });
    await ReloadOrgTables(coordinator);
  }
  setOrganization(orgRec.id);
  setDefaultProj(orgRec.id, memory, setProject);
  return orgRec.id;
};

export default createOrg;
