import { useMemo, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import {
  Organization,
  RoleNames,
  ISharedStrings,
  OrganizationD,
  OrganizationMembershipD,
  GroupMembershipD,
  GroupD,
} from '../model';
import { useCheckOnline, cleanFileName } from '../utils';
import {
  offlineError,
  useArtifactCategory,
  useOrgWorkflowSteps,
  useProjectType,
  useRole,
} from '.';
import { useSnackBar } from '../hoc/SnackBar';
import Memory from '@orbit/memory';
import { setDefaultProj } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { useTeamApiPull } from './useTeamApiPull';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';
import {
  RecordIdentity,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import useAllUsersRec from './useAllUsers';

export const useTeamCreate = () => {
  const { CreateOrgWorkflowSteps } = useOrgWorkflowSteps();
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [, setOrganization] = useGlobal('organization');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProject] = useGlobal('project');
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const { showMessage } = useSnackBar();
  const { setProjectType } = useProjectType();
  const { getRoleId } = useRole();
  const allUsersRec = useAllUsersRec();
  const teamApiPull = useTeamApiPull();
  const checkOnline = useCheckOnline('Team Create');
  const workingOnItRef = useRef(false);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { AddOrgNoteCategoryOps } = useArtifactCategory();

  const memory = useMemo(
    () => coordinator?.getSource('memory') as Memory,
    [coordinator]
  );

  const orgRoleId = useMemo(() => getRoleId(RoleNames.Admin), [getRoleId]);

  const OrgRelated = (t: RecordTransformBuilder, orgRec: OrganizationD) => {
    const opArray: RecordOperation[] = [];

    let orgMember: OrganizationMembershipD = {
      type: 'organizationmembership',
      attributes: {},
    } as OrganizationMembershipD;
    let groupMbr: GroupMembershipD = {
      type: 'groupmembership',
      attributes: {},
    } as GroupMembershipD;

    let allUsersGroup = allUsersRec(orgRec.id);
    if (!allUsersGroup) {
      let group: GroupD = {
        type: 'group',
        attributes: {
          name: `All users of ${orgRec.attributes.name}`,
          abbreviation: `all-users`,
          allUsers: true,
        },
      } as GroupD;
      opArray.push(
        ...[
          ...AddRecord(t, group, user, memory),
          ...ReplaceRelatedRecord(t, group, 'owner', 'organization', orgRec.id),
        ]
      );
      allUsersGroup = group;
    }
    opArray.push(
      ...[
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
      ]
    );
    opArray.push(
      ...[
        ...AddRecord(t, groupMbr, user, memory),
        ...ReplaceRelatedRecord(t, groupMbr, 'user', 'user', user),
        ...ReplaceRelatedRecord(
          t,
          groupMbr,
          'group',
          'group',
          allUsersGroup?.id
        ),
        ...ReplaceRelatedRecord(t, groupMbr, 'role', 'role', orgRoleId),
      ]
    );
    return opArray;
  };

  interface ICreateOrgProps {
    orgRec: Organization;
    process: string;
  }

  const createOrg = async (props: ICreateOrgProps) => {
    const { orgRec, process } = props;

    const t = new RecordTransformBuilder();
    const opArray: RecordOperation[] = [
      ...AddRecord(t, orgRec, user, memory),
      ...ReplaceRelatedRecord(
        t,
        orgRec as RecordIdentity,
        'owner',
        'user',
        user
      ),
    ];
    opArray.push(...OrgRelated(t, orgRec as OrganizationD));
    opArray.push(...AddOrgNoteCategoryOps(t, orgRec.id));
    opArray.push(...CreateOrgWorkflowSteps(t, process, orgRec.id as string));
    await memory.update(opArray);
    // the next line prevents shutting off busy until all workflow steps are created
    if (!offlineOnly) await teamApiPull(orgRec.id as string); // Update slug value
    setOrganization(orgRec.id as string);
    setOrgRole(RoleNames.Admin);
    setDefaultProj(orgRec.id as string, memory, (pid: string) => {
      setProject(pid);
      setProjectType(pid);
    });

    return orgRec.id as string;
  };

  return (
    organization: Organization,
    process: string,
    cb?: (org: string) => void
  ) => {
    const {
      name,
      description,
      websiteUrl,
      logoUrl,
      publicByDefault,
      defaultParams,
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
        defaultParams,
      },
    } as Organization;

    if (!workingOnItRef.current) {
      workingOnItRef.current = true;
      createOrg({ orgRec, process })
        .then((org: string) => {
          workingOnItRef.current = false;
          if (cb) cb(org);
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
