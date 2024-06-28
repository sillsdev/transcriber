import { useGlobal } from 'reactn';
import { OrgWorkflowStepD } from '../model';
import { usePlanType, useOrgWorkflowSteps, getTool, ToolSlug } from '.';

export const useFilteredSteps = () => {
  const [plan] = useGlobal('plan');
  const [organization] = useGlobal('organization');
  const getPlanType = usePlanType();
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();

  return (cb: (orgSteps: OrgWorkflowStepD[]) => void) => {
    const { scripture } = getPlanType(plan);
    GetOrgWorkflowSteps({ process: 'ANY', org: organization }).then(
      (orgsteps: OrgWorkflowStepD[]) => {
        const wf = orgsteps.filter(
          (s) =>
            scripture ||
            ![ToolSlug.Paratext, ToolSlug.Verses].includes(
              getTool(s.attributes?.tool)
            )
        );
        cb(wf);
      }
    );
  };
};
