import { useGlobal } from 'reactn';
import { SharedResourceReference } from '../model';
import { TransformBuilder } from '@orbit/data';

export const useShaRefDelete = () => {
  const [memory] = useGlobal('memory');

  return async (shaRefRecs: SharedResourceReference[]) => {
    const t = new TransformBuilder();
    const ops = [];
    for (const shaRefRec of shaRefRecs) {
      ops.push(t.removeRecord(shaRefRec));
    }
    await memory.update(ops);
  };
};
