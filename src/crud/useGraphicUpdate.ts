import { useGlobal } from 'reactn';
import { GraphicD } from '../model';
import { UpdateRecord } from '../model/baseModel';
import JSONAPISource from '@orbit/jsonapi';
import { RecordIdentity } from '@orbit/records';
import { recToMemory } from './syncToMemory';

export const useGraphicUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  return async (graphicRec: GraphicD) => {
    await memory.update((t) => UpdateRecord(t, graphicRec, user));
    return await recToMemory({
      recId: graphicRec as RecordIdentity,
      memory,
      remote,
    });
  };
};
