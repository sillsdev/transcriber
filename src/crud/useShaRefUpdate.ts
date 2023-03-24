import { useGlobal } from 'reactn';
import { SharedResourceReference } from '../model';
import { Operation, TransformBuilder } from '@orbit/data';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';

export const useShaRefUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (
    sharedResourceReferences: SharedResourceReference[],
    sharedResource: string,
    category: string,
    cluster?: string
  ) => {
    const t = new TransformBuilder();
    let ops: Operation[] = [];
    for (const sharedResourceReference of sharedResourceReferences) {
      ops = ops.concat([
        ...UpdateRecord(t, sharedResourceReference, user),
        ...ReplaceRelatedRecord(
          t,
          sharedResourceReference,
          'sharedResource',
          'sharedresource',
          sharedResource
        ),
        ...ReplaceRelatedRecord(
          t,
          sharedResourceReference,
          'artifactCategory',
          'artifactcategory',
          category
        ),
      ]);
      if (cluster) {
        ops.push(
          ...ReplaceRelatedRecord(
            t,
            sharedResourceReference,
            'cluster',
            'cluster',
            cluster
          )
        );
      }
    }
    memory.update(ops);
  };
};
