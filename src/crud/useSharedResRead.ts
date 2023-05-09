import { useGlobal } from 'reactn';
import { SharedResource } from '../model';
import { QueryBuilder } from '@orbit/data';
import related from './related';

export const useSharedResRead = () => {
  const [memory] = useGlobal('memory');

  return (passId: string) => {
    const sharedResources = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('sharedresource')
    ) as SharedResource[];
    const selected = sharedResources.filter(
      (sr) => related(sr, 'passage') === passId
    );
    return selected.length > 0 ? selected[0] : undefined;
  };
};
