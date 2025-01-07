import { useGlobal } from '../context/GlobalContext';
import { RecordIdentity } from '@orbit/records';

export const useSharedResDelete = () => {
  const [memory] = useGlobal('memory');

  return async (sharedResRec: RecordIdentity) => {
    await memory.update((t) => t.removeRecord(sharedResRec));
  };
};
