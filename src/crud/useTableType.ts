import { useGlobal } from 'reactn';
import { Plan, PlanTypeD } from '../model';
import { related } from '.';

export const useTableType = (table: string) => {
  const [memory] = useGlobal('memory');

  return (plan: Plan) => {
    const typeId = related(plan, 'plantype');
    const planTypes = memory.cache.query((q) =>
      q.findRecords(`${table}type`)
    ) as PlanTypeD[];
    const typeRecs = planTypes.filter((t) => t.id === typeId);
    const planType = typeRecs[0]?.attributes?.name;
    return planType ? planType.toLowerCase() : 'other';
  };
};
