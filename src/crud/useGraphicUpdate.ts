import { useGlobal } from 'reactn';
import { Graphic } from '../model';
import { TransformBuilder } from '@orbit/data';
import { UpdateRecord } from '../model/baseModel';

export const useGraphicUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (graphicRec: Graphic) => {
    await memory.update((t: TransformBuilder) =>
      UpdateRecord(t, graphicRec, user)
    );
  };
};
