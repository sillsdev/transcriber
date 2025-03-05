import { useGlobal } from '../context/GlobalContext';
import { SectionResource, SectionResourceUser } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { RecordIdentity, RecordTransformBuilder } from '@orbit/records';

export const useSecResUserCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (resource: SectionResource) => {
    const secResUser = {
      type: 'sectionresourceuser',
      attributes: {},
    } as SectionResourceUser;
    const t = new RecordTransformBuilder();
    const ops = [
      ...AddRecord(t, secResUser, user, memory),
      ...ReplaceRelatedRecord(
        t,
        secResUser as RecordIdentity,
        'sectionresource',
        'sectionresource',
        resource.id
      ),
      ...ReplaceRelatedRecord(
        t,
        secResUser as RecordIdentity,
        'user',
        'user',
        user
      ),
    ];
    await memory.update(ops);
  };
};
