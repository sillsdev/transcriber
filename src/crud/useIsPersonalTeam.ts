import { useGlobal } from 'reactn';
import { QueryBuilder } from '@orbit/data';
import { Organization } from '../model';

export const useIsPersonalTeam = () => {
  const [memory] = useGlobal('memory');

  return (teamId: string) => {
    const organizations = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[];

    return (
      organizations.filter(
        (o) => o.id === teamId && />.*Personal</.test(o?.attributes?.name || '')
      ).length > 0
    );
  };
};
