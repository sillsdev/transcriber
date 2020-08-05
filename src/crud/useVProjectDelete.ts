import { useGlobal } from 'reactn';
import { TransformBuilder } from '@orbit/data';
import { VProject } from '../model';
import { related } from '../utils';

export const useVProjectDelete = () => {
  const [memory] = useGlobal('memory');

  return async (vProject: VProject) => {
    const id = related(vProject, 'project');
    await memory.update((t: TransformBuilder) =>
      t.removeRecord({
        type: 'project',
        id: id,
      })
    );
    await memory.update((t: TransformBuilder) =>
      t.removeRecord({
        type: 'plan',
        id: vProject.id,
      })
    );
  };
};
