import { Plan, VProject, OfflineProjectD } from '../model';
import { related } from '.';
import { useOrbitData } from '../hoc/useOrbitData';

export const useOfflnProjRead = () => {
  const offlineProjectRecs = useOrbitData<OfflineProjectD[]>('offlineproject');

  return (plan: Plan | VProject | string) => {
    const projectId =
      typeof plan === 'string' ? plan : related(plan, 'project');
    const selected = offlineProjectRecs.filter(
      (o) => related(o, 'project') === projectId
    );
    console.log('useOfflnProjRead', plan, selected, offlineProjectRecs);
    return selected.length > 0 ? selected[0] : ({} as OfflineProjectD);
  };
};
