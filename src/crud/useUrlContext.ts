import { remoteIdGuid } from './remoteId';
import { useGlobal } from 'reactn';
import { usePlan, useVProjectRead, related, useProjectType } from '.';

export const useUrlContext = () => {
  const [memory] = useGlobal('memory');
  const [organization, setOrganization] = useGlobal('organization');
  const [plan, setPlan] = useGlobal('plan');
  const [project, setProject] = useGlobal('project');
  const { getPlan } = usePlan();
  const vProject = useVProjectRead();
  const { setProjectType } = useProjectType();

  return (planRemId: string) => {
    let planId = remoteIdGuid('plan', planRemId, memory.keyMap) || planRemId;
    if (planId && planId !== plan) setPlan(planId);
    else planId = plan;
    const planRec = getPlan(planId);
    if (planRec) {
      const projectId = related(planRec, 'project');
      const team = vProject(planRec);
      const orgId = related(team, 'organization');
      if (orgId !== organization) setOrganization(orgId);
      if (projectId !== project) setProject(projectId);
      setProjectType(projectId);
      return projectId;
    }
    return project;
  };
};
