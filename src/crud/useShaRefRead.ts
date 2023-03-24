import { useGlobal } from 'reactn';
import { SharedResource } from '../model';
import { QueryBuilder } from '@orbit/data';
import related from './related';

export const useShaRefRead = () => {
  const [memory] = useGlobal('memory');

  return (resId: string) => {
    const sharedResourceReferences = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('sharedresourcereference')
    ) as SharedResource[];
    const selected = sharedResourceReferences.filter(
      (sr) => related(sr, 'sharedResource') === resId
    );
    return selected;
  };
};
