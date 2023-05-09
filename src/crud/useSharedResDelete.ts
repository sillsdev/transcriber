import { useGlobal } from 'reactn';
import { SharedResource } from '../model';
import { TransformBuilder } from '@orbit/data';

export const useSharedResDelete = () => {
  const [memory] = useGlobal('memory');

  return async (sharedResRec: SharedResource) => {
    await memory.update((t: TransformBuilder) => t.removeRecord(sharedResRec));
  };
};
