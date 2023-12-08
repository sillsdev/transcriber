import { useGlobal } from 'reactn';
import { Project } from '../model';
import { RecordOperation } from '@orbit/records';
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
    let ops: RecordOperation[] = [];
    offlineProjectCreate(
      project,
      ops,
      memory,
      fingerprint,
      project.attributes.dateCreated,
      project.attributes.dateCreated,
      isElectron
    );
    await backup.sync((t) => ops);
    await memory.sync((t) => ops);
  };
};
