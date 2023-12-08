import { useGlobal } from 'reactn';
import { GraphicD } from '../model';
import { UpdateRecord } from '../model/baseModel';

export const useGraphicUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (graphicRec: GraphicD) => {
    await memory.update((t) => UpdateRecord(t, graphicRec, user));
  };
};
