import { useGlobal } from '../mods/reactn';
import { TransformBuilder } from '@orbit/data';
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
        await memory.sync(
          await backup.push((t: TransformBuilder) => [t.updateRecord(op)])
        );
      }
    }
  };
};
