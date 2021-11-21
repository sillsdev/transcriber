import {
  Group,
  GroupMembership,
  Invitation,
  OrganizationMembership,
  Plan,
  Project,
  Section,
  User,
} from '../model';
import Memory from '@orbit/memory';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { localeDefault } from '../utils';
import * as actions from '../store';
import { related } from '.';
import { UpdateRelatedRecord } from '../model/baseModel';

export function getUserById(users: User[], id: string): User {
  let findit = users.filter((u) => u.id === id);
  if (findit.length > 0) return findit[0];
  //to avoid typescript issues for a case that won't happen
  return {} as User;
}

export function GetUser(memory: Memory, user: string): User {
  const userRec: User[] = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('user')
  ) as any;
  return getUserById(userRec, user);
}

export function SetUserLanguage(
  memory: Memory,
  user: string,
  setLanguage: typeof actions.setLanguage
) {
  var userrec = GetUser(memory, user);
  setLanguage(
    userrec.attributes?.locale
      ? userrec.attributes?.locale
      : localeDefault(false)
  );
}
export function RemoveUserFromOrg(
  memory: Memory,
  userToRemove: string,
  organization: string | undefined,
  user: string
) {
  var t = new TransformBuilder();
  var ops: Operation[] = [];
  const deletedUser = memory.cache.query((q: QueryBuilder) =>
    q.findRecord({ type: 'user', id: userToRemove })
  ) as User;

  const orgMemberRecs = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('organizationmembership')
  ) as OrganizationMembership[];
  var userOrgRec = orgMemberRecs.filter(
    (o) => related(o, 'user') === userToRemove
  );

  if (organization)
    userOrgRec = userOrgRec.filter(
      (o) => related(o, 'organization') === organization
    );

  const organizationIds = userOrgRec.map((om) => related(om, 'organization'));

  userOrgRec.forEach((o) => {
    ops.push(t.removeRecord(o));
  });

  const invites = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('invitation')
  ) as Invitation[];

  const inviteRec = invites.filter(
    (i) =>
      i.attributes.email === deletedUser.attributes.email &&
      organizationIds.includes(related(i, 'organization'))
  );
  inviteRec.forEach((i) => {
    ops.push(t.removeRecord(i));
  });
  const groupRecs = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('group')
  ) as Group[];
  const orgGroups = groupRecs
    .filter((g) => organizationIds.includes(related(g, 'owner')))
    .map((og) => og.id);
  const grpMbrRecs = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('groupmembership')
  ) as GroupMembership[];
  const userGrpOrgRecs = grpMbrRecs.filter(
    (g) =>
      related(g, 'user') === userToRemove &&
      orgGroups.includes(related(g, 'group'))
  );
  userGrpOrgRecs.forEach((g) => {
    ops.push(t.removeRecord(g));
  });
  /* in theory there might be projects online with this user assigned that the user has never downloaded...but such a small chance ignore it */
  const projects = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('project')
  ) as Project[];
  const projectids = projects
    .filter((p) => organizationIds.includes(related(p, 'organization')))
    .map((p) => p.id);
  var plans = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('plan')
  ) as Plan[];
  const planids = plans
    .filter((p) => projectids.includes(related(p, 'project')))
    .map((p) => p.id);
  var sections = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('section')
  ) as Section[];
  sections = sections.filter((s) => planids.includes(related(s, 'plan')));

  var assigned = sections.filter(
    (s) => related(s, 'transcriber') === userToRemove
  );
  assigned.forEach((s) =>
    ops.push(...UpdateRelatedRecord(t, s, 'transcriber', 'user', '', user))
  );

  assigned = sections.filter((s) => related(s, 'editor') === userToRemove);
  assigned.forEach((s) =>
    ops.push(...UpdateRelatedRecord(t, s, 'editor', 'user', '', user))
  );
  //TODO!  Add removal from discussions
  memory.update(ops);
}
