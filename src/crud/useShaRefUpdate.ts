import { useGlobal } from 'reactn';
import { SharedResourceReference } from '../model';
import { Operation, TransformBuilder } from '@orbit/data';
import { UpdateRecord } from '../model/baseModel';

export const useShaRefUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (sharedResourceReferences: SharedResourceReference[]) => {
    const t = new TransformBuilder();
    let ops: Operation[] = [];
    for (const sharedResourceReference of sharedResourceReferences) {
      ops = ops.concat([...UpdateRecord(t, sharedResourceReference, user)]);
    }
    memory.update(ops);
  };
};
