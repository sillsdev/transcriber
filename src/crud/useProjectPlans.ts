import { useGlobal } from 'reactn';
import { Plan } from '../model';
import { QueryBuilder } from '@orbit/data';
import { related } from '.';

export const useProjectPlans = () => {
  const [memory] = useGlobal('memory');

  return (projectId: string) => {
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    return plans.filter((p) => related(p, 'project') === projectId);
  };
};
