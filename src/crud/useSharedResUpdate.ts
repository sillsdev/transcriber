import { useGlobal } from 'reactn';
import { SharedResource } from '../model';
import { TransformBuilder } from '@orbit/data';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';

export const useSharedResUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (sharedResource: SharedResource, category: string) => {
    await memory.update((t: TransformBuilder) => [
      ...UpdateRecord(t, sharedResource, user),
      ...ReplaceRelatedRecord(
        t,
        sharedResource,
        'artifactCategory',
        'artifactcategory',
        category
      ),
    ]);
  };
};
