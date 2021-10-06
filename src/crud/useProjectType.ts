import { TransformBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { related } from '.';
import { Project, ProjectType, VProject } from '../model';
import { logError, Severity } from '../utils';

export const useProjectType = () => {
  const [memory] = useGlobal('memory');
  const [, setProjType] = useGlobal('projType');
  const [errorReporter] = useGlobal('errorReporter');

  const getProjType = (project: string | VProject) => {
    var proj: Project;
    var pId: string;
    if (typeof project === 'string') {
      if (project === '') return '';
      pId = project;
    } else pId = related(project, 'project');
    if (!pId) return '';
    try {
      proj = memory.cache.query((q) =>
        q.findRecord({ type: 'project', id: pId })
      ) as Project;
    } catch (error) {
      // During refresh the project might not be found
      console.log('project not found in useProjectType');
      return 'Scripture';
    }
    var ptId = related(proj, 'projecttype');
    var pt: ProjectType;
    if (ptId) {
      pt = memory.cache.query((q) =>
        q.findRecord({ type: 'projecttype', id: ptId })
      ) as ProjectType;
      return pt.attributes.name;
    } else {
      //default to scripture so they don't lose any book info they have
      console.log('MISSING PROJECT TYPE!', proj);
      logError(
        Severity.error,
        errorReporter,
        `missing project type=project${proj.attributes.name}${proj.keys?.remoteId}`
      );
      var pts = memory.cache.query((q) =>
        q.findRecords('projecttype')
      ) as ProjectType[];
      var online = Boolean(proj.keys?.remoteId);
      pts = pts.filter(
        (p) =>
          Boolean(p.keys?.remoteId) === online &&
          p.attributes.name === 'Scripture'
      );
      if (pts.length > 0) {
        pt = pts[0];
        memory.update((t: TransformBuilder) =>
          t.replaceRelatedRecord(proj, 'projecttype', {
            type: 'projecttype',
            id: pt.id,
          })
        );
        return pt.attributes.name;
      }
    }
    return 'Scripture';
  };

  const setProjectType = (projectId: string) => {
    const pt = getProjType(projectId);
    setProjType(pt);
    return pt;
  };

  return { setProjectType, getProjType };
};
