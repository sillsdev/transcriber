import { VProjectD, Plan, ProjectD, Project } from '../model';
import { related, useTableType } from '.';
import { useOrbitData } from '../hoc/useOrbitData';

export const useVProjectRead = () => {
  const getPlanType = useTableType('plan');
  const projects = useOrbitData<ProjectD[]>('project');

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

  return (plan: Plan, project?: Project) => {
    const projectId = related(plan, 'project');
    const projectRec = project ?? projects.find((p) => p.id === projectId);
    if (projectRec) {
      return {
        ...projectRec,
        ...plan,
        type: 'vproject',
        attributes: {
          ...projectRec.attributes,
          ...plan.attributes,
          tags: parseTags(plan?.attributes?.tags),
          type: getPlanType(plan),
          sheetUser: related(projectRec, 'editsheetuser'),
          sheetGroup: related(projectRec, 'editsheetgroup'),
          publishUser: related(projectRec, 'publishuser'),
          publishGroup: related(projectRec, 'publishgroup'),
        },
        relationships: {
          ...projectRec.relationships,
          ...plan.relationships,
        },
      } as VProjectD;
    }
    return plan as VProjectD;
  };
};
