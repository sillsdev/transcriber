import { Plan, PlanType } from '../model';
import { useGlobal } from 'reactn';
import { usePlan } from './usePlan';
import { related } from './related';

export const usePlanType = () => {
  const [memory] = useGlobal('memory');
  const { getPlan } = usePlan();

  return (plan: string) => {
    let planRec: Plan | null = null;
    if (plan && plan !== '') planRec = getPlan(plan);
    const typeId = planRec && related(planRec, 'plantype');
    let typeRec: PlanType | null = null;
    if (typeId)
      typeRec = memory.cache.query((q) =>
        q.findRecord({ type: 'plantype', id: typeId })
      ) as PlanType;
    const flat = planRec ? planRec?.attributes?.flat : false;
    const scripture = typeRec
      ? typeRec?.attributes?.name?.toLowerCase()?.indexOf('scripture') !== -1
      : false;
    return { scripture, flat };
  };
};
