import { useGlobal } from '../mods/reactn';
import { Project } from '../model';
import { TransformBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { findRecord, useOfflnProjCreate, useOfflnProjRead } from '.';

export const useOfflineAvailToggle = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const offlineProjectRead = useOfflnProjRead();
  const createOP = useOfflnProjCreate();

  return async (projectId: string) => {
    var offlineProject = offlineProjectRead(projectId);
    if (offlineProject.attributes) {
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
    } else {
      var project = findRecord(memory, 'project', projectId) as Project;
      await createOP(project); //created as true
    }
  };
};
