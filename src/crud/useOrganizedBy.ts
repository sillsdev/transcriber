import { useGlobal } from 'reactn';
import { Plan } from '../model';
import { QueryBuilder } from '@orbit/data';
import { camel2Title } from '../utils';

export const useOrganizedBy = () => {
  const [memory] = useGlobal('memory');

  return (planId: string) => {
    if (!planId || planId === '') return undefined;
    const planRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    const selected = planRec.filter((p) => p.id === planId);
    if (selected.length > 0) {
      const response = selected[0]?.attributes?.organizedBy;
      if (response) return camel2Title(response);
    }
    return undefined;
  };
};
