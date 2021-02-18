import { useGlobal } from 'reactn';
import { TransformBuilder } from '@orbit/data';
import { VProject } from '../model';
import { related } from '.';
import { useOfflnProjDelete } from './useOfflnProjDelete';

export const useVProjectDelete = () => {
  const [memory] = useGlobal('memory');
  const offlineDelete = useOfflnProjDelete();
  const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');


  return async (vProject: VProject) => {
    const id = related(vProject, 'project');
    await offlineDelete(id);
    await memory.update((t: TransformBuilder) => [
      t.removeRecord({
        type: 'project',
        id: id,
      }),
      t.removeRecord({
        type: 'plan',
        id: vProject.id,
      })]
    );
    setProjectsLoaded(projectsLoaded.filter(p => p!==id));
  };
};
