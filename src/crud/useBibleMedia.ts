import { useGlobal } from '../context/GlobalContext';
import { OrganizationD, PlanD, ProjectD } from '../model';

export const useBibleMedia = () => {
  const [memory] = useGlobal('memory');
  const getBibleMediaTeam = async () => {
    let orgs = memory?.cache.query((q) =>
      q
        .findRecords('organization')
        .filter({ attribute: 'name', value: 'BibleMedia' })
    ) as OrganizationD[];
    if (orgs.length === 0) {
      orgs = await memory.query((q) =>
        q
          .findRecords('organization')
          .filter({ attribute: 'name', value: 'BibleMedia' })
      );
    }
    return orgs[0];
  };
  const getBibleMediaProject = async () => {
    let projects = memory?.cache.query((q) =>
      q
        .findRecords('project')
        .filter({ attribute: 'name', value: 'BibleMedia' })
    ) as ProjectD[];
    if (projects.length === 0) {
      projects = (await memory.query((q) =>
        q
          .findRecords('project')
          .filter({ attribute: 'name', value: 'BibleMedia' })
      )) as ProjectD[];
    }
    return projects[0];
  };

  const getBibleMediaPlan = async () => {
    let plans = memory?.cache.query((q) =>
      q.findRecords('plan').filter({ attribute: 'name', value: 'BibleMedia' })
    ) as PlanD[];
    if (plans.length === 0) {
      await getBibleMediaProject();
      plans = await memory.query((q) =>
        q.findRecords('plan').filter({ attribute: 'name', value: 'BibleMedia' })
      );
    }
    return plans[0];
  };
  return {
    getBibleMediaTeam,
    getBibleMediaProject,
    getBibleMediaPlan,
  };
};
