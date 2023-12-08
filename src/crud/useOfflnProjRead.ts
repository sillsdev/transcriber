import { useGlobal } from 'reactn';
import { Plan, VProject, OfflineProjectD } from '../model';
import { related } from '.';

export const useOfflnProjRead = () => {
  const [memory] = useGlobal('memory');

  return (plan: Plan | VProject | string) => {
    const projectId =
      typeof plan === 'string' ? plan : related(plan, 'project');
    const offlineProjectRecs = memory.cache.query((q) =>
      q.findRecords('offlineproject')
    ) as OfflineProjectD[];
    const selected = offlineProjectRecs.filter(
      (o) => related(o, 'project') === projectId
    );
    return selected.length > 0 ? selected[0] : ({} as OfflineProjectD);
  };
};
