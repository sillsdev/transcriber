import { remoteIdGuid } from './remoteId';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { usePlan, useVProjectRead, related, useProjectType, useRole } from '.';
import { RecordKeyMap } from '@orbit/records';

export const useUrlContext = () => {
  const [memory] = useGlobal('memory');
  const [organization, setOrganization] = useGlobal('organization');
  const { setMyOrgRole } = useRole();
  const [, setPlan] = useGlobal('plan');
  const [, setProject] = useGlobal('project');
  const { getPlan } = usePlan();
  const vProject = useVProjectRead();
  const { setProjectType } = useProjectType();
  const getGlobal = useGetGlobal();

  return (planRemId: string) => {
    let planId =
      remoteIdGuid('plan', planRemId, memory?.keyMap as RecordKeyMap) ||
      planRemId;
    if (planId && planId !== getGlobal('plan')) setPlan(planId);
    else planId = getGlobal('plan');
    const planRec = getPlan(planId);

    if (planRec) {
      const projectId = related(planRec, 'project');
      const team = vProject(planRec);
      const orgId = related(team, 'organization');
      if (orgId !== organization) setOrganization(orgId);
      setMyOrgRole(orgId); //do this even if the org hasn't changed because this gets reset more often
      if (projectId !== getGlobal('project')) setProject(projectId);
      setProjectType(projectId);
      return projectId;
    }
    return getGlobal('project');
  };
};
