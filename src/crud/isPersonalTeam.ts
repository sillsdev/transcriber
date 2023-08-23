import { Organization } from '../model';

export const isPersonalTeam = (
  teamId: string,
  organizations: Organization[]
) => {
  return organizations.find(
    (o) => o.id === teamId && />.*Personal</.test(o?.attributes?.name || '')
  );
};
