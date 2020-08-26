import { remoteIdGuid } from './remoteId';
import { useGlobal } from 'reactn';
import { usePlan, useVProjectRead, related } from '.';

export const useUrlContext = () => {
  const [memory] = useGlobal('memory');
  const [organization, setOrganization] = useGlobal('organization');
  const [plan, setPlan] = useGlobal('plan');
  const [project, setProject] = useGlobal('project');
  const { getPlan } = usePlan();
  const vProject = useVProjectRead();

  return (planRemId: string) => {
    const planId = remoteIdGuid('plan', planRemId, memory.keyMap);
    if (planId !== plan) setPlan(planId);
    const planRec = getPlan(planId);
    if (planRec) {
      const projectId = related(planRec, 'project');
      const team = vProject(planRec);
      const orgId = related(team, 'organization');
      if (orgId !== organization) setOrganization(orgId);
      if (projectId !== project) setProject(projectId);
    }
  };
};
