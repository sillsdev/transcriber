import { useGlobal } from 'reactn';
import { related } from '.';
import { Project, ProjectType, VProject } from "../model";

export const useProjectType = () => {
  const [memory] = useGlobal('memory');
  const [, setProjType] = useGlobal('projType');

  const getProjType = (project: string|VProject) => {
    var proj: Project | VProject;
    if (typeof project === 'string') {
      if (project === '') return '';
      proj = memory.cache.query((q) =>
        q.findRecord({ type: 'project', id: project.toString() })
      ) as Project;
    }
    else
      proj = project;
    var pt = memory.cache.query((q) =>
        q.findRecord({ type: 'projecttype', id: related(proj, 'projecttype') })
      ) as ProjectType;
    return pt.attributes.name;
};

  const setProjectType = (projectId: string) => {
    const pt = getProjType(projectId);
    setProjType(pt);
    return pt;
  };

return { setProjectType, getProjType };
}
