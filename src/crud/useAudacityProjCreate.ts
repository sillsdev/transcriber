import { useGlobal } from 'reactn';
import { Operation, RecordIdentity } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { audacityProjectCreate } from './audacityProjectCreate';

export const useAudacityProjCreate = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');

  return async (passageRecId: RecordIdentity, audacityName: string) => {
    // local update only, migrate offlineproject to include offlineAvailable
    const backup = coordinator.getSource('backup') as IndexedDBSource;
    let ops: Operation[] = [];
    audacityProjectCreate(passageRecId, ops, memory, audacityName);
    await memory.sync(await backup.push(ops));
  };
};
