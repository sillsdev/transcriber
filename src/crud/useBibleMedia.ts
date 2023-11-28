import { useGlobal } from 'reactn';
import { QueryBuilder } from '@orbit/data';
import JSONAPISource from '@orbit/jsonapi';
import { Project } from '../model';

export const useBibleMedia = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const getBibleMediaTeam = async () => {
    const orgs = memory.query((q: QueryBuilder) =>
      q
        .findRecords('organization')
        .filter({ attribute: 'name', value: 'BibleMedia' })
    ) as any;
    if (orgs.length === 0) {
      var tr = await remote.pull((q) =>
        q
          .findRecords('organization')
          .filter({ attribute: 'name', value: 'BibleMedia' })
      );
      await memory.sync(tr);
      return (tr[0].operations[0] as any).record;
    }
    return orgs[0];
  };
  const getBibleMediaProject = async () => {
    const projects = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('project')
        .filter({ attribute: 'name', value: 'BibleMedia' })
    ) as any;
    if (projects.length === 0) {
      var tr = await remote.pull((q) =>
        q
          .findRecords('project')
          .filter({ attribute: 'name', value: 'BibleMedia' })
      );
      await memory.sync(tr);
      return (tr[0].operations[0] as any).record as Project;
    }
    return projects[0];
  };

  const getBibleMediaPlan = async () => {
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan').filter({ attribute: 'name', value: 'BibleMedia' })
    ) as any;
    if (plans.length === 0) {
      await getBibleMediaProject();
      var tr = await remote.pull((q) =>
        q.findRecords('plan').filter({ attribute: 'name', value: 'BibleMedia' })
      );
      await memory.sync(tr);
      return (tr[0].operations[0] as any).record;
    }
    return plans[0];
  };
  return {
    getBibleMediaTeam,
    getBibleMediaProject,
    getBibleMediaPlan,
  };
};
