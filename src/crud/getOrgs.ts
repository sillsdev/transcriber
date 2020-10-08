import { QueryBuilder } from '@orbit/data';
import Memory from '@orbit/memory';
import { Organization, OrganizationMembership } from '../model';
import { related } from '.';

export function getOrgs(memory: Memory, currentUser: string): Organization[] {
  let orgs: Organization[] = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('organization')
  ) as any;
  if (process.env.REACT_APP_MODE === 'electron') {
    let oms: OrganizationMembership[] = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organizationmembership')
    ) as any;
    orgs = orgs.filter((o) =>
      oms
        .filter((om) => related(om, 'user') === currentUser)
        .map((om) => related(om, 'organization'))
        .includes(o.id)
    );
  }
  return orgs;
}
