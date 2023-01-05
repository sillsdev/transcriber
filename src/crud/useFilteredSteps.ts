import { useGlobal } from '../mods/reactn';
import { OrgWorkflowStep } from '../model';
import { usePlanType, useOrgWorkflowSteps, getTool, ToolSlug } from '.';

export const useFilteredSteps = () => {
  const [plan] = useGlobal('plan');
  const getPlanType = usePlanType();
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();

  return (cb: (orgSteps: OrgWorkflowStep[]) => void) => {
    const { scripture } = getPlanType(plan);
    GetOrgWorkflowSteps({ process: 'ANY' }).then(
      (orgsteps: OrgWorkflowStep[]) => {
        const wf = orgsteps.filter(
          (s) => scripture || getTool(s.attributes?.tool) !== ToolSlug.Paratext
        );
        cb(wf);
      }
    );
  };
};
