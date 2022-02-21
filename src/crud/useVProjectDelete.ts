import { VProject } from '../model';
import { related } from '.';
import { useProjectDelete } from './useProjectDelete';

export const useVProjectDelete = () => {
  const projectDelete = useProjectDelete();

  return async (vProject: VProject) => {
    const id = related(vProject, 'project');
    projectDelete(id);
  };
};
