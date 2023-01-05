import { useGlobal } from '../mods/reactn';
import { Plan, VProject, OfflineProject } from '../model';
import { QueryBuilder } from '@orbit/data';
import { related } from '.';

export const useOfflnProjRead = () => {
  const [memory] = useGlobal('memory');

  return (plan: Plan | VProject | string) => {
    const projectId =
      typeof plan === 'string' ? plan : related(plan, 'project');
    const offlineProjectRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('offlineproject')
    ) as OfflineProject[];
    const selected = offlineProjectRecs.filter(
      (o) => related(o, 'project') === projectId
    );
    return selected.length > 0 ? selected[0] : ({} as OfflineProject);
  };
};
