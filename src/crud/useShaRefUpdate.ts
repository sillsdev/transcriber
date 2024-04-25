import { useGlobal } from 'reactn';
import { SharedResourceReferenceD } from '../model';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
import { UpdateRecord } from '../model/baseModel';

export const useShaRefUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (sharedResourceReferences: SharedResourceReferenceD[]) => {
    const t = new RecordTransformBuilder();
    let ops: RecordOperation[] = [];
    for (const sharedResourceReference of sharedResourceReferences) {
      ops = ops.concat([...UpdateRecord(t, sharedResourceReference, user)]);
    }
    memory.update(ops);
  };
};
