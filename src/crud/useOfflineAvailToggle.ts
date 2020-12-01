import { useGlobal } from 'reactn';
import { OfflineProject } from '../model';
import { TransformBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';

export const useOfflineAvailToggle = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');

  return async (offlineProject: OfflineProject) => {
    // local update only, migrate offlineproject to include offlineAvailable
    const backup = coordinator.getSource('backup') as IndexedDBSource;
    await memory.sync(
      await backup.push((t: TransformBuilder) => [
        t.updateRecord({
          ...offlineProject,
          attributes: {
            ...offlineProject.attributes,
            offlineAvailable: !offlineProject?.attributes?.offlineAvailable,
          },
        }),
      ])
    );
  };
};
