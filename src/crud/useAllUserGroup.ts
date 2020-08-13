import { useGlobal } from 'reactn';
import { Group } from '../model';
import { QueryBuilder } from '@orbit/data';
import { related } from '../utils';

export const useAllUserGroup = () => {
  const [memory] = useGlobal('memory');

  return (teamId: string) => {
    const groups = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('group')
    ) as Group[];
    const selected = groups.filter(
      (g) => related(g, 'owner') === teamId && g.attributes.allUsers
    );
    return selected.length > 0 ? selected[0] : ({} as Group);
  };
};
