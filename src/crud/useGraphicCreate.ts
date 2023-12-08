import { useGlobal } from 'reactn';
import Graphic from '../model/graphic';
import { RecordIdentity, RecordTransformBuilder } from '@orbit/records';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

interface GraphicAttributes {
  resourceType: string;
  resourceId: number;
  info: string;
}

export const useGraphicCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');

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
  };
};
