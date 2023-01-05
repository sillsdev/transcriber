import { useGlobal } from '../mods/reactn';
import { VProject, Plan, Project } from '../model';
import { QueryBuilder } from '@orbit/data';
import { related, useTableType } from '.';

export const useVProjectRead = () => {
  const [memory] = useGlobal('memory');
  const getPlanType = useTableType('plan');

  const parseTags = (val: any) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        // ignore invalid json
      }
    }
    return {};
  };

  return (plan: Plan) => {
    const projectId = related(plan, 'project');
    const projects = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('project')
    ) as Project[];
    const projectRecs = projects.filter((p) => p.id === projectId);
    if (projectRecs.length > 0) {
      return {
        ...projectRecs[0],
        ...plan,
        type: 'vproject',
        attributes: {
          ...projectRecs[0].attributes,
          ...plan.attributes,
          tags: parseTags(plan?.attributes?.tags),
          type: getPlanType(plan),
        },
        relationships: {
          ...projectRecs[0].relationships,
          ...plan.relationships,
        },
      } as VProject;
    }
    return plan as VProject;
  };
};
