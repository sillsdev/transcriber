import { useGlobal } from '../context/GlobalContext';
import { useOfflnProjRead } from '.';
import IndexedDBSource from '@orbit/indexeddb';

export const useOfflnProjDelete = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const getOfflineProject = useOfflnProjRead();

  return async (projectId: string) => {
    const backup = coordinator?.getSource('backup') as IndexedDBSource;
    const op = getOfflineProject(projectId);
    if (op.attributes) {
      await backup.sync((t) => [t.removeRecord(op)]);
      await memory.sync((t) => [t.removeRecord(op)]);
    }
  };
};
