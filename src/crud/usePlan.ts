import { useGlobal } from 'reactn';
import { Plan } from '../model';
import { QueryBuilder } from '@orbit/data';

export const usePlan = () => {
  const [memory] = useGlobal('memory');

  const getPlan = (planId: string) => {
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    const selected = plans.filter((p) => p.id === planId);
    return selected.length > 0 ? selected[0] : null;
  };

  const getPlanName = (planId: string) => {
    const planRec = getPlan(planId);
    return planRec ? planRec?.attributes?.name : 'Unknown';
  };

  return { getPlan, getPlanName };
};
