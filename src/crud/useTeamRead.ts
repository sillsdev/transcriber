import { useGlobal } from 'reactn';
import { Organization } from '../model';
import { QueryBuilder } from '@orbit/data';

export const useTeamRead = () => {
  const [memory] = useGlobal('memory');

  return (teamId: string) => {
    const teams = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[];
    const selected = teams.filter((t) => t.id === teamId);
    return selected.length > 0 ? selected[0] : ({} as Organization);
  };
};
