import { useGlobal } from 'reactn';
import { QueryBuilder, Record } from '@orbit/data';

export const useTypeId = () => {
  const [memory] = useGlobal('memory');

  return (type: string, table: string) => {
    const ptRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(`${table}type`)
    ) as Record[];
    const selected = ptRecs.filter(
      (p) => p?.attributes?.name?.toLowerCase() === type.toLowerCase()
    );
    return selected.length > 0 ? selected[0].id : '';
  };
};
