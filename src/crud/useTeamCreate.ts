import { useMemo, useRef } from 'react';
import { useGlobal } from 'reactn';
import {
  Organization,
  OrganizationMembership,
  Group,
  GroupMembership,
  RoleNames,
  ISharedStrings,
} from '../model';
import { useCheckOnline, cleanFileName } from '../utils';
import { offlineError, useOrgWorkflowSteps, useProjectType, useRole } from '.';
import { useSnackBar } from '../hoc/SnackBar';
import Memory from '@orbit/memory';
import { TransformBuilder } from '@orbit/data';
import { setDefaultProj, allUsersRec } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { useTeamApiPull } from './useTeamApiPull';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';

export const useTeamCreate = () => {
  const { CreateOrgWorkflowSteps } = useOrgWorkflowSteps();
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [, setOrganization] = useGlobal('organization');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProject] = useGlobal('project');
  const [, offlineOnly] = useGlobal('offlineOnly');
  const { showMessage } = useSnackBar();
  const { setProjectType } = useProjectType();
  const { getRoleId } = useRole();
  const teamApiPull = useTeamApiPull();
  const checkOnline = useCheckOnline();
  const workingOnItRef = useRef(false);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const memory = useMemo(
    () => coordinator.getSource('memory') as Memory,
    [coordinator]
  );

  const OrgRelated = async (orgRec: Organization) => {
    let orgMember: OrganizationMembership = {
      type: 'organizationmembership',
      attributes: {},
    } as OrganizationMembership;
    let groupMbr: GroupMembership = {
      type: 'groupmembership',
      attributes: {},
    } as GroupMembership;

    const orgRoleId = getRoleId(RoleNames.Admin);

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
      ...ReplaceRelatedRecord(t, orgMember, 'role', 'role', orgRoleId),
    ]);
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, groupMbr, user, memory),
      ...ReplaceRelatedRecord(t, groupMbr, 'user', 'user', user),
      ...ReplaceRelatedRecord(t, groupMbr, 'group', 'group', allUsersGroup?.id),
      ...ReplaceRelatedRecord(t, groupMbr, 'role', 'role', orgRoleId),
    ]);
  };

  interface ICreateOrgProps {
    orgRec: Organization;
    process: string;
    cb: (oId: string) => void;
  }

  const createOrg = async (props: ICreateOrgProps) => {
    const { orgRec, process, cb } = props;

    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, orgRec, user, memory),
      ...ReplaceRelatedRecord(t, orgRec, 'owner', 'user', user),
    ]);
    if (!offlineOnly) await teamApiPull(orgRec.id); // Update slug value
    OrgRelated(orgRec).then(() => {
      CreateOrgWorkflowSteps(process, orgRec.id).then(() => {
        setOrganization(orgRec.id);
        setOrgRole(RoleNames.Admin);
        setDefaultProj(orgRec.id, memory, (id: string) => {
          setProject(id);
          setProjectType(id);
        });
        cb(orgRec.id);
      });
    });
  };

  return (
    organization: Organization,
    process: string,
    cb?: (org: string) => void
  ) => {
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
        //NR?publishingData: '{}',
      },
    } as Organization;

    const handleCreated = (oId: string) => {
      cb && cb(oId);
    };

    if (!workingOnItRef.current) {
      workingOnItRef.current = true;
      createOrg({ orgRec, process, cb: handleCreated })
        .then(() => {
          workingOnItRef.current = false;
        })
        .catch((err) => {
          checkOnline((online) => {
            workingOnItRef.current = false;
            offlineError({ ts, online, showMessage, err });
          });
        });
    }
  };
};
