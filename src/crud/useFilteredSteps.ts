import { useGlobal } from 'reactn';
import { OrgWorkflowStep } from '../model';
import { usePlanType, useOrgWorkflowSteps } from '.';

export const useFilteredSteps = () => {
  const [plan] = useGlobal('plan');
  const getPlanType = usePlanType();
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();

  return (cb: (orgSteps: OrgWorkflowStep[]) => void) => {
    const { scripture } = getPlanType(plan);
    GetOrgWorkflowSteps({ process: 'ANY' }).then(
      (orgsteps: OrgWorkflowStep[]) => {
        const wf = orgsteps.filter(
          (s) =>
            scripture ||
            s.attributes.name.toLowerCase().indexOf('paratext') === -1
        );
        cb(wf);
      }
    );
  };
};
