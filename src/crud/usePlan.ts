import { useGlobal } from '../context/GlobalContext';
import { Plan } from '../model';
import { InitializedRecord } from '@orbit/records';

export const usePlan = () => {
  const [memory] = useGlobal('memory');

  const getPlan = (planId: string) => {
    const plans = memory?.cache.query((q) => q.findRecords('plan')) as (Plan &
      InitializedRecord)[];
    const selected = plans.filter((p) => p.id === planId);
    return selected.length > 0 ? selected[0] : null;
  };

  const getPlanName = (planId: string) => {
    const planRec = getPlan(planId);
    return planRec?.attributes?.name || '';
  };

  return { getPlan, getPlanName };
};
