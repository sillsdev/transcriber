import { useGlobal } from 'reactn';
import { Plan } from '../model';
import { related } from '.';

export const useProjectPlans = () => {
  const [memory] = useGlobal('memory');

  return (projectId: string) => {
    const plans = memory.cache.query((q) => q.findRecords('plan')) as Plan[];
    return plans.filter((p) => related(p, 'project') === projectId);
  };
};
