import Memory from '@orbit/memory';
import { Organization, OrganizationD, OrganizationMembershipD } from '../model';
import { related } from '.';

export function getOrgs(memory: Memory, currentUser: string): Organization[] {
  let orgs = memory?.cache.query((q) =>
    q.findRecords('organization')
  ) as OrganizationD[];
  if (process.env.REACT_APP_MODE === 'electron') {
    let oms = memory?.cache.query((q) =>
      q.findRecords('organizationmembership')
    ) as OrganizationMembershipD[];
    const userOrgIds = oms
      .filter((om) => related(om, 'user') === currentUser)
      .map((om) => related(om, 'organization')) as string[];
    orgs = orgs.filter((o) => userOrgIds.includes(o.id));
  }
  return orgs;
}
