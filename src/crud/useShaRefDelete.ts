import { useGlobal } from '../context/GlobalContext';
import { SharedResourceReferenceD } from '../model';
import { RecordTransformBuilder } from '@orbit/records';

export const useShaRefDelete = () => {
  const [memory] = useGlobal('memory');

  return async (shaRefRecs: SharedResourceReferenceD[]) => {
    const t = new RecordTransformBuilder();
    const ops = [];
    for (const shaRefRec of shaRefRecs) {
      ops.push(t.removeRecord(shaRefRec));
    }
    await memory.update(ops);
  };
};
