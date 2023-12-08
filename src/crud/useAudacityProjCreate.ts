import { useGlobal } from 'reactn';
import { RecordOperation, RecordIdentity } from '@orbit/records';
import IndexedDBSource from '@orbit/indexeddb';
import { audacityProjectCreate } from './audacityProjectCreate';

export const useAudacityProjCreate = () => {
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');

  return async (passageRecId: RecordIdentity, audacityName: string) => {
    // local update only, migrate offlineproject to include offlineAvailable
    const backup = coordinator.getSource('backup') as IndexedDBSource;
    let ops: RecordOperation[] = [];
    audacityProjectCreate(passageRecId, ops, user, memory, audacityName);
    await backup.sync((t) => ops);
    await memory.sync((t) => ops);
  };
};
