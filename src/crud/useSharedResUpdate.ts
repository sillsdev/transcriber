import { useGlobal } from 'reactn';
import { ArtifactCategory, SharedResourceD } from '../model';
import { RecordIdentity, RecordTransformBuilder } from '@orbit/records';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';
import { findRecord } from '.';

interface ShResUpdProps {
  onUpdRef?: (id: string, val: string) => void;
}

export const useSharedResUpdate = ({ onUpdRef }: ShResUpdProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (
    sharedResource: SharedResourceD,
    category: string,
    mediaId?: string
  ) => {
    const t = new RecordTransformBuilder();
    const ops = [
      ...UpdateRecord(t, sharedResource, user),
      ...ReplaceRelatedRecord(
        t,
        sharedResource,
        'artifactCategory',
        'artifactcategory',
        category
      ),
      ...ReplaceRelatedRecord(
        t,
        sharedResource,
        'titleMediafile',
        'mediafile',
        mediaId
      ),
    ];
    if (sharedResource.attributes.note) {
      const catRec = findRecord(memory, 'artifactcategory', category) as
        | ArtifactCategory
        | undefined;
      if (catRec && onUpdRef) {
        const passage = sharedResource.relationships.passage
          .data as RecordIdentity;
        onUpdRef(passage.id, `NOTE ${catRec.attributes.categoryname}`);
      }
    }
    await memory.update(ops);
  };
};
