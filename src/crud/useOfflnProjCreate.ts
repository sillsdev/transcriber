import { useGlobal } from '../mods/reactn';
import { Project } from '../model';
import { Operation } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { offlineProjectCreate } from './offlineProjectCreate';
import { isElectron } from '../api-variable';

export const useOfflnProjCreate = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [fingerprint] = useGlobal('fingerprint');

  return async (project: Project) => {
    // local update only, migrate offlineproject to include offlineAvailable
    const backup = coordinator.getSource('backup') as IndexedDBSource;
    let ops: Operation[] = [];
    offlineProjectCreate(
      project,
      ops,
      memory,
      fingerprint,
      project.attributes.dateCreated,
      project.attributes.dateCreated,
      isElectron
    );
    await memory.sync(await backup.push(ops));
  };
};
