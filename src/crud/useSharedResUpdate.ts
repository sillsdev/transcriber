import { useGlobal } from 'reactn';
import { ArtifactCategory, SharedResource } from '../model';
import { RecordIdentity, TransformBuilder } from '@orbit/data';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';
import { findRecord } from '.';

export const useSharedResUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (sharedResource: SharedResource, category: string) => {
    const t = new TransformBuilder();
    const ops = [
      ...UpdateRecord(t, sharedResource, user),
      ...ReplaceRelatedRecord(
        t,
        sharedResource,
        'artifactCategory',
        'artifactcategory',
        category
      ),
    ];
    if (sharedResource.attributes.note) {
      const catRec = findRecord(memory, 'artifactcategory', category) as
        | ArtifactCategory
        | undefined;
      if (catRec) {
        ops.push(
          t.replaceAttribute(
            sharedResource.relationships.passage.data as RecordIdentity,
            'reference',
            `NOTE ${catRec.attributes.categoryname}`
          )
        );
      }
    }
    await memory.update(ops);
  };
};
