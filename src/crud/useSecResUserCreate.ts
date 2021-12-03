import { useGlobal } from 'reactn';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { SectionResource, SectionResourceUser } from '../model';
import { AddRecord } from '../model/baseModel';
import { related } from '.';
import { logError, Severity } from '../utils';

export const useSecResUserCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [reporter] = useGlobal('errorReporter');

  return async (mediaId: string) => {
    const sectionresources = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('sectionresource')
    ) as SectionResource[];
    const resource = sectionresources.find(
      (r) => related(r, 'mediafile') === mediaId
    );
    if (!resource) {
      logError(
        Severity.error,
        reporter,
        `missing section resource for mediaId=${mediaId}`
      );
      return;
    }
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
