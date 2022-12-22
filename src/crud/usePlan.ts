import { useGlobal } from 'reactn';
import { ISharedStrings, Plan } from '../model';
import { QueryBuilder } from '@orbit/data';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedSelector } from '../selector';

export const usePlan = () => {
  const [memory] = useGlobal('memory');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const getPlan = (planId: string) => {
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    const selected = plans.filter((p) => p.id === planId);
    return selected.length > 0 ? selected[0] : null;
  };

  const getPlanName = (planId: string) => {
    const planRec = getPlan(planId);
    return planRec ? planRec?.attributes?.name : ts.loading;
  };

  return { getPlan, getPlanName };
};
