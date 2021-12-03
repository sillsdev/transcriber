import { useGlobal } from 'reactn';
import { TransformBuilder } from '@orbit/data';
import { SectionResource, SectionResourceUser } from '../model';
import { AddRecord } from '../model/baseModel';

export const useSecResUserCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (resource: SectionResource) => {
    const secResUser = {
      type: 'sectionresourceuser',
      attributes: {},
    } as SectionResourceUser;
    memory.schema.initializeRecord(secResUser);
    const userRecId = { type: 'user', id: user };
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, secResUser, user, memory),
      t.replaceRelatedRecord(secResUser, 'sectionresource', resource),
      t.replaceRelatedRecord(secResUser, 'user', userRecId),
    ];
    await memory.update(ops);
  };
};
