import { useGlobal } from '../context/GlobalContext';
import { Project } from '../model';
import IndexedDBSource from '@orbit/indexeddb';
import { findRecord, useOfflnProjCreate, useOfflnProjRead } from '.';
import { RecordTransformBuilder } from '@orbit/records';

export const useOfflineAvailToggle = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const offlineProjectRead = useOfflnProjRead();
  const createOP = useOfflnProjCreate();

  return async (projectId: string) => {
    var offlineProject = offlineProjectRead(projectId);
    if (offlineProject.attributes) {
      // local update only, migrate offlineproject to include offlineAvailable
      const backup = coordinator?.getSource('backup') as IndexedDBSource;
      const transform = (t: RecordTransformBuilder) => [
        t.updateRecord({
          ...offlineProject,
          attributes: {
            ...offlineProject.attributes,
            offlineAvailable: !offlineProject?.attributes?.offlineAvailable,
          },
        }),
      ];
      await backup.sync(transform);
      await memory.sync(transform);
    } else {
      var project = findRecord(memory, 'project', projectId) as Project;
      await createOP(project); //created as true
    }
  };
};
