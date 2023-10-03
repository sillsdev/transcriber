import { useGlobal } from 'reactn';
import Graphic from '../model/graphic';
import { TransformBuilder } from '@orbit/data';
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
    memory.schema.initializeRecord(graphicRec);
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, graphicRec, user, memory),
      ...ReplaceRelatedRecord(
        t,
        graphicRec,
        'organization',
        'organization',
        organization
      ),
    ];
    if (mediafileId) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          graphicRec,
          'mediafile',
          'mediafile',
          mediafileId
        )
      );
    }
    await memory.update(ops);
  };
};
