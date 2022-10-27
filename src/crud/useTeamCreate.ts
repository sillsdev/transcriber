import { useGlobal, useRef } from 'reactn';
import {
  Organization,
  ISharedStrings,
  OrganizationMembership,
  Group,
  GroupMembership,
  RoleNames,
} from '../model';
import { useCheckOnline, cleanFileName } from '../utils';
import { offlineError, useProjectType, useRole } from '.';
import { useSnackBar } from '../hoc/SnackBar';
import Memory from '@orbit/memory';
import Coordinator from '@orbit/coordinator';
import { TransformBuilder } from '@orbit/data';
import { setDefaultProj, allUsersRec } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { useTeamApiPull } from './useTeamApiPull';
import * as actions from '../store';

interface IDispatchProps {
  resetOrbitError: typeof actions.resetOrbitError;
}

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps, IDispatchProps {}

export const useTeamCreate = (props: IProps) => {
  const { resetOrbitError } = props;
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [, setOrganization] = useGlobal('organization');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProject] = useGlobal('project');
  const [, offlineOnly] = useGlobal('offlineOnly');
  const { showMessage } = useSnackBar();
  const { setProjectType } = useProjectType();
  const { getRoleRec } = useRole();
  const teamApiPull = useTeamApiPull();
  const checkOnline = useCheckOnline(resetOrbitError);
  const workingOnItRef = useRef(false);
  const OrgRelated = async (
    coordinator: Coordinator,
    orgRec: Organization,
    user: string
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

    const orgRoleRec = getRoleRec(RoleNames.Admin, true);
    const grpRoleRec = getRoleRec(RoleNames.Admin, false);
    let allUsersGroup = allUsersRec(memory, orgRec.id);
    if (!allUsersGroup) {
      let group: Group = {
        type: 'group',
        attributes: {
          name: `All users of ${orgRec.attributes.name}`,
          abbreviation: `all-users`,
          allUsers: true,
        },
      } as Group;
      await memory.update((t: TransformBuilder) => [
        ...AddRecord(t, group, user, memory),
        ...ReplaceRelatedRecord(t, group, 'owner', 'organization', orgRec.id),
      ]);
      allUsersGroup = group;
    }
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, orgMember, user, memory),
      ...ReplaceRelatedRecord(t, orgMember, 'user', 'user', user),
      ...ReplaceRelatedRecord(
        t,
        orgMember,
        'organization',
        'organization',
        orgRec.id
      ),
      ...ReplaceRelatedRecord(t, orgMember, 'role', 'role', orgRoleRec[0].id),
    ]);
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, groupMbr, user, memory),
      ...ReplaceRelatedRecord(t, groupMbr, 'user', 'user', user),
      ...ReplaceRelatedRecord(t, groupMbr, 'group', 'group', allUsersGroup?.id),
      ...ReplaceRelatedRecord(t, groupMbr, 'role', 'role', grpRoleRec[0].id),
    ]);
  };

  interface ICreateOrgProps {
    orgRec: Organization;
  }

  const createOrg = async (props: ICreateOrgProps) => {
    const { orgRec } = props;

    const memory = coordinator.getSource('memory') as Memory;
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, orgRec, user, memory),
      ...ReplaceRelatedRecord(t, orgRec, 'owner', 'user', user),
    ]);
    if (!offlineOnly) await teamApiPull(orgRec.id); // Update slug value
    await OrgRelated(coordinator, orgRec, user);

    setOrganization(orgRec.id);
    setOrgRole(RoleNames.Admin);
    setDefaultProj(orgRec.id, memory, setProject, setProjectType);
    return orgRec.id;
  };

  return (organization: Organization, cb?: (org: string) => void) => {
    const { name, description, websiteUrl, logoUrl, publicByDefault } =
      organization?.attributes;
    let orgRec = {
      type: 'organization',
      attributes: {
        name,
        slug: cleanFileName(name), // real slugs are created by API
        description,
        websiteUrl,
        logoUrl,
        publicByDefault,
        defaultParams: '{}',
      },
    } as Organization;

    if (!workingOnItRef.current) {
      workingOnItRef.current = true;
      createOrg({ orgRec })
        .then((org: string) => {
          workingOnItRef.current = false;
          if (cb) cb(org);
        })
        .catch((err) => {
          checkOnline((online) => {
            workingOnItRef.current = false;
            offlineError({ ...props, online, showMessage, err });
          });
        });
    }
  };
};
