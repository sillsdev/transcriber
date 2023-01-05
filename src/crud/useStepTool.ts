import { useMemo } from 'react';
import { useGlobal } from '../mods/reactn';
import { OrgWorkflowStep } from '../model';
import { findRecord } from '.';

export const getTool = (jsonTool?: string) => {
  if (jsonTool) {
    var tool = JSON.parse(jsonTool);
    return tool.tool || '';
  }
  return '';
};
export const getToolSettings = (jsonTool?: string) => {
  if (jsonTool) {
    var tool = JSON.parse(jsonTool);
    return tool.settings || '';
  }
  return '';
};
export const useStepTool = (stepId: string) => {
  const [memory] = useGlobal('memory');

  return useMemo(() => {
    if (!stepId) return { tool: '', settings: '' };
    const workflowstep = findRecord(
      memory,
      'orgworkflowstep',
      stepId
    ) as OrgWorkflowStep;
    return {
      tool: getTool(workflowstep?.attributes?.tool),
      settings: getToolSettings(workflowstep?.attributes?.tool),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, memory.cache]);
};
