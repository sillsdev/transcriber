import { useGlobal } from 'reactn';
import {
  User,
  OfflineProject,
  Organization,
  OrganizationMembership,
  ProjectD,
  GroupMembership,
} from '../model';
import { useRecOfType, related } from '.';

export enum ListEnum  {organization, project}

export const useOfflineList = () => {
  const recOfType = useRecOfType();
  const [memory] = useGlobal('memory');

  return (u: User, lType?: ListEnum) => {
    const offlineProjects = recOfType('offlineproject') as OfflineProject[];
    const projs = new Set<string>();
    offlineProjects.forEach((p) => {
      if (p?.attributes?.offlineAvailable) {
        projs.add(related(p, 'project'));
      }
    });
    if (lType === ListEnum.project) {
      const members = recOfType(
        'groupmembership'
      ) as GroupMembership[];
      const groups = new Set<string>();
      members.forEach((m) => {
        if (related(m, 'user') === u.id) groups.add(related(m, 'group'));
      });
      const grpIds = Array.from(groups);
      const projName = Array<string>();
      Array.from(projs).forEach((id) => {
        const projRec = memory.cache.query((q) =>
          q.findRecord({ type: 'project', id })
        ) as ProjectD;
        if (grpIds.includes(related(projRec, 'group')))
          projName.push(projRec.attributes.name);
      });
      return projName.sort().join(', ');
    }
    const members = recOfType(
      'organizationmembership'
    ) as OrganizationMembership[];
    const orgs = new Set<string>();
    members.forEach((m) => {
      if (related(m, 'user') === u.id) orgs.add(related(m, 'organization'));
    });
    const projects = recOfType('project') as ProjectD[];
    const offlineOrgs = new Set<string>();
    projects.forEach((p) => {
      const olOrg = related(p, 'organization');
      if (projs.has(p.id) && orgs.has(olOrg)) {
        offlineOrgs.add(olOrg);
      }
    });
    const groupName = Array<string>();
    Array.from(offlineOrgs).forEach((id) => {
      const orgRec = memory.cache.query((q) =>
        q.findRecord({ type: 'organization', id })
      ) as Organization;
      const name = orgRec.attributes.name;
      if (!name.startsWith('>') || !name.endsWith('<')) {
        groupName.push(orgRec.attributes.name);
      }
    });
    return groupName.sort().join(', ');
  };
};
