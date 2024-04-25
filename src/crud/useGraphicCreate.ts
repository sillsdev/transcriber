import { useGlobal } from 'reactn';
import Graphic, { GraphicD } from '../model/graphic';
import {
  RecordIdentity,
  RecordKeyMap,
  RecordTransformBuilder,
} from '@orbit/records';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import JSONAPISource from '@orbit/jsonapi';
import { waitForIt } from '../utils';
import remoteId from './remoteId';
import { recToMemory } from './syncToMemory';

interface GraphicAttributes {
  resourceType: string;
  resourceId: number;
  info: string;
}

export const useGraphicCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  return async (attributes: GraphicAttributes, mediafileId?: string) => {
    const graphicRec = {
      type: 'graphic',
      attributes: {
        ...attributes,
      },
    } as Graphic;
    const t = new RecordTransformBuilder();
    const ops = [
      ...AddRecord(t, graphicRec, user, memory),
      ...ReplaceRelatedRecord(
        t,
        graphicRec as RecordIdentity,
        'organization',
        'organization',
        organization
      ),
    ];
    if (mediafileId) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          graphicRec as RecordIdentity,
          'mediafile',
          'mediafile',
          mediafileId
        )
      );
    }
    await memory.update(ops);
    await waitForIt(
      'remote graphic create',
      () =>
        remoteId(
          'graphic',
          graphicRec.id as string,
          memory.keyMap as RecordKeyMap
        ) !== undefined,
      () => false,
      100
    );
    return (await recToMemory({
      recId: graphicRec as RecordIdentity,
      memory,
      remote,
    })) as GraphicD;
  };
};
