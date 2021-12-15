import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { OrgWorkflowStep } from '../model';
import { QueryBuilder } from '@orbit/data';

export const useStepTool = (stepId: string) => {
  const [memory] = useGlobal('memory');

  return useMemo(() => {
    if (!stepId) return '';
    const workflowstep = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'orgworkflowstep', id: stepId })
    ) as OrgWorkflowStep;
    const tools = JSON.parse(workflowstep.attributes?.tool);
    return tools.tool;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, memory.cache]);
};
