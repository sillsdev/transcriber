import { useGlobal } from 'reactn';
import {
  Organization,
  ISharedStrings,
  OrganizationMembership,
  Group,
  GroupMembership,
} from '../model';
import { Online, cleanFileName } from '../utils';
import { offlineError, useProjectType, useRole } from '.';
import { useSnackBar } from '../hoc/SnackBar';
import Auth from '../auth/Auth';
import Memory from '@orbit/memory';
import Coordinator from '@orbit/coordinator';
import { TransformBuilder, RecordIdentity } from '@orbit/data';
import { setDefaultProj, allUsersRec } from '.';
import { AddRecord } from '../model/baseModel';
import { useTeamApiPull } from './useTeamApiPull';

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  auth: Auth;
}

export const useTeamCreate = (props: IProps) => {
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const [, setConnected] = useGlobal('connected');
  const [, offlineOnly] = useGlobal('offlineOnly');
  const { showMessage } = useSnackBar();
  const { setProjectType } = useProjectType();
  const { getRoleRec } = useRole();
  const teamApiPull = useTeamApiPull();

  const OrgRelated = async (
    coordinator: Coordinator,
    orgRec: Organization,
    userRecId: RecordIdentity
  ) => {
    const memory = coordinator.getSource('memory') as Memory;

    let orgMember: OrganizationMembership = {
      type: 'organizationmembership',
      attributes: {},
    } as OrganizationMembership;
    let groupMbr: GroupMembership = {
      type: 'groupmembership',
      attributes: {},
    } as GroupMembership;

    const orgRoleRec = getRoleRec('admin', true);
    const grpRoleRec = getRoleRec('admin', false);
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

  interface ICreateOrgProps {
    orgRec: Organization;
  }

  const createOrg = async (props: ICreateOrgProps) => {
    const { orgRec } = props;

    const memory = coordinator.getSource('memory') as Memory;
    const userRecId = { type: 'user', id: user };

    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, orgRec, user, memory),
      t.replaceRelatedRecord(orgRec, 'owner', userRecId),
    ]);
    if (!offlineOnly) await teamApiPull(orgRec.id); // Update slug value
    await OrgRelated(coordinator, orgRec, userRecId);

    setOrganization(orgRec.id);
    setDefaultProj(orgRec.id, memory, setProject, setProjectType);
    return orgRec.id;
  };

  return (organization: Organization, cb?: (org: string) => void) => {
    const {
      name,
      description,
      websiteUrl,
      logoUrl,
      publicByDefault,
    } = organization?.attributes;

    let orgRec = {
      type: 'organization',
      attributes: {
        name,
        slug: cleanFileName(name), // real slugs are created by API
        description,
        websiteUrl,
        logoUrl,
        publicByDefault,
      },
    } as Organization;

    Online((online) => {
      setConnected(online);
      createOrg({ orgRec })
        .then((org: string) => {
          if (cb) cb(org);
        })
        .catch((err) => offlineError({ ...props, online, showMessage, err }));
    }, props.auth);
  };
};
