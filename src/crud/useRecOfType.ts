import { useGlobal } from 'reactn';
import { QueryBuilder, Record } from '@orbit/data';

export const useRecOfType = () => {
  const [memory] = useGlobal('memory');

  return (recType: string) =>
    memory.cache.query((q: QueryBuilder) => q.findRecords(recType)) as Record[];
};
