import { useGlobal } from '../context/GlobalContext';
import { useAudacityProjRead } from '.';
import IndexedDBSource from '@orbit/indexeddb';

export const useAudacityProjDelete = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const getAudacityProject = useAudacityProjRead();

  return async (passageId: string) => {
    const backup = coordinator?.getSource('backup') as IndexedDBSource;
    const op = getAudacityProject(passageId);
    if (op.attributes) {
      await backup.sync((t) => [t.removeRecord(op)]);
      await memory.sync((t) => [t.removeRecord(op)]);
    }
  };
};
