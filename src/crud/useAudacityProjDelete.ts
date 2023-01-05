import { useGlobal } from '../mods/reactn';
import { TransformBuilder } from '@orbit/data';
import { useAudacityProjRead } from '.';
import IndexedDBSource from '@orbit/indexeddb';

export const useAudacityProjDelete = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const getAudacityProject = useAudacityProjRead();

  return async (passageId: string) => {
    const backup = coordinator.getSource('backup') as IndexedDBSource;
    const op = getAudacityProject(passageId);
    if (op.attributes)
      await memory.sync(
        await backup.push((t: TransformBuilder) => [t.removeRecord(op)])
      );
  };
};
