import { Organization } from '../model';

export function isPersonalTeam(teamId: string, organizations: Organization[]) {
  return organizations.find(
    (o) => o.id === teamId && />.*Personal</.test(o?.attributes?.name || '')
  );
}
