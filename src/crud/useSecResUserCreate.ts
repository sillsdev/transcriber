import { useGlobal } from '../mods/reactn';
import { TransformBuilder } from '@orbit/data';
import { SectionResource, SectionResourceUser } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

export const useSecResUserCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (resource: SectionResource) => {
    const secResUser = {
      type: 'sectionresourceuser',
      attributes: {},
    } as SectionResourceUser;
    memory.schema.initializeRecord(secResUser);
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, secResUser, user, memory),
      ...ReplaceRelatedRecord(
        t,
        secResUser,
        'sectionresource',
        'sectionresource',
        resource.id
      ),
      ...ReplaceRelatedRecord(t, secResUser, 'user', 'user', user),
    ];
    await memory.update(ops);
  };
};
