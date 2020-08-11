import { useGlobal } from 'reactn';
import { Plan } from '../model';
import { QueryBuilder } from '@orbit/data';

export const usePlanName = () => {
  const [memory] = useGlobal('memory');

  return (planId: string) => {
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    const selected = plans.filter((p) => p.id === planId);
    return selected.length > 0 ? selected[0]?.attributes?.name : 'Unknown';
  };
};
