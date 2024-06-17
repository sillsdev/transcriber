import { useMemo, useRef } from 'react';
import { useGlobal } from 'reactn';
import {
  Organization,
  RoleNames,
  ISharedStrings,
  OrganizationD,
  OrganizationMembershipD,
  GroupMembershipD,
  GroupD,
  ArtifactCategoryD,
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
import { setDefaultProj, allUsersRec } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { useTeamApiPull } from './useTeamApiPull';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';
import { RecordIdentity } from '@orbit/records';

export const useTeamCreate = () => {
  const { CreateOrgWorkflowSteps } = useOrgWorkflowSteps();
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [, setOrganization] = useGlobal('organization');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProject] = useGlobal('project');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { showMessage } = useSnackBar();
  const { setProjectType } = useProjectType();
  const { getRoleId } = useRole();
  const teamApiPull = useTeamApiPull();
  const checkOnline = useCheckOnline();
  const workingOnItRef = useRef(false);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { localizedArtifactCategory } = useArtifactCategory();

  const memory = useMemo(
    () => coordinator.getSource('memory') as Memory,
    [coordinator]
  );

  const OrgRelated = async (orgRec: OrganizationD) => {
    let orgMember: OrganizationMembershipD = {
      type: 'organizationmembership',
      attributes: {},
    } as OrganizationMembershipD;
    let groupMbr: GroupMembershipD = {
      type: 'groupmembership',
      attributes: {},
    } as GroupMembershipD;

    const orgRoleId = getRoleId(RoleNames.Admin);

    let allUsersGroup = allUsersRec(memory, orgRec.id);
    if (!allUsersGroup) {
      let group: GroupD = {
        type: 'group',
        attributes: {
          name: `All users of ${orgRec.attributes.name}`,
          abbreviation: `all-users`,
          allUsers: true,
        },
      } as GroupD;
      await memory.update((t) => [
        ...AddRecord(t, group, user, memory),
        ...ReplaceRelatedRecord(t, group, 'owner', 'organization', orgRec.id),
      ]);
      allUsersGroup = group;
    }
    await memory.update((t) => [
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
    await memory.update((t) => [
      ...AddRecord(t, groupMbr, user, memory),
      ...ReplaceRelatedRecord(t, groupMbr, 'user', 'user', user),
      ...ReplaceRelatedRecord(t, groupMbr, 'group', 'group', allUsersGroup?.id),
      ...ReplaceRelatedRecord(t, groupMbr, 'role', 'role', orgRoleId),
    ]);
  };
  const OrgNoteCategories = async (orgRec: OrganizationD) => {
    if (offlineOnly) return;
    // Add default note categories
    const noteCategories = ['chapter', 'title'];
    noteCategories.forEach(async (category) => {
      let noteCategory: ArtifactCategoryD = {
        type: 'artifactcategory',
        attributes: {
          specialuse: category,
          categoryname: localizedArtifactCategory(category),
          discussion: false,
          resource: false,
          note: true,
        },
      } as ArtifactCategoryD;
      await memory.update((t) => [
        ...AddRecord(t, noteCategory, user, memory),
        ...ReplaceRelatedRecord(
          t,
          noteCategory,
          'organization',
          'organization',
          orgRec.id
        ),
      ]);
    });
  };

  interface ICreateOrgProps {
    orgRec: Organization;
    process: string;
  }

  const createOrg = async (props: ICreateOrgProps) => {
    const { orgRec, process } = props;
    await memory.update((t) => [
      ...AddRecord(t, orgRec, user, memory),
      ...ReplaceRelatedRecord(
        t,
        orgRec as RecordIdentity,
        'owner',
        'user',
        user
      ),
    ]);
    await OrgRelated(orgRec as OrganizationD);
    await OrgNoteCategories(orgRec as OrganizationD);
    await CreateOrgWorkflowSteps(process, orgRec.id as string);
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
