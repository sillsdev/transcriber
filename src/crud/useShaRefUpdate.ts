import { useGlobal } from 'reactn';
import { SharedResourceReference, SharedResource } from '../model';
import { Operation, TransformBuilder } from '@orbit/data';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';

export const useShaRefUpdate = (sharedResource: SharedResource) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (sharedResourceReferences: SharedResourceReference[]) => {
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
          sharedResource.id
        ),
      ]);
    }
    memory.update(ops);
  };
};
