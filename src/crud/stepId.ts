import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { OrgWorkflowStep } from '../model';
import { QueryBuilder } from '@orbit/data';
import { related } from '.';

export const useStepId = (step: string) => {
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');

  return useMemo(() => {
    const workflowsteps = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStep[];
    const internalizationStep = workflowsteps
      .filter((s) => related(s, 'organization') === organization)
      .find((s) => s.attributes?.name === step);
    return internalizationStep;
  }, [step, memory.cache, organization]);
};
