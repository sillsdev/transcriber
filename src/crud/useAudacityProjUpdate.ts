import { useGlobal } from 'reactn';
import { useAudacityProjRead, useAudacityProjCreate } from '.';
import IndexedDBSource from '@orbit/indexeddb';

export const useAudacityProjUpdate = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const getAudacityProject = useAudacityProjRead();
  const audCreate = useAudacityProjCreate();

  return async (passageId: string, audacityName: string) => {
    const backup = coordinator.getSource('backup') as IndexedDBSource;
    const op = getAudacityProject(passageId);
    if (!op?.attributes) {
      await audCreate({ type: 'passage', id: passageId }, audacityName);
    } else if (op.attributes) {
      if (op?.attributes?.audacityName !== audacityName) {
        op.attributes = { ...op.attributes, audacityName };
        await backup.sync((t) => [t.updateRecord(op)]);
        await memory.sync((t) => [t.updateRecord(op)]);
      }
    }
  };
};
