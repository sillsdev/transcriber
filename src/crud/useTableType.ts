import { useGlobal } from '../mods/reactn';
import { Plan } from '../model';
import { QueryBuilder, Record } from '@orbit/data';
import { related } from '.';

export const useTableType = (table: string) => {
  const [memory] = useGlobal('memory');

  return (plan: Plan) => {
    const typeId = related(plan, 'plantype');
    const planTypes = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(`${table}type`)
    ) as Record[];
    const typeRecs = planTypes.filter((t) => t.id === typeId);
    const planType = typeRecs[0]?.attributes?.name;
    return planType ? planType.toLowerCase() : 'other';
  };
};
