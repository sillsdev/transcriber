import { useGlobal } from 'reactn';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { SectionResource, SectionResourceUser } from '../model';
import { related } from '.';
import { logError, Severity } from '../utils';

export const useSecResUserDelete = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [reporter] = useGlobal('errorReporter');

  return async (mediaId: string, secResUserRec?: SectionResourceUser) => {
    if (secResUserRec) {
      memory.update((t: TransformBuilder) => t.removeRecord(secResUserRec));
      return;
    }
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
        `can't find section resource for mediaId=${mediaId}`
      );
      return;
    }
    const sectionResourceUsers = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('sectionresourceuser')
    ) as SectionResourceUser[];
    const rec = sectionResourceUsers.filter(
      (r) =>
        related(r, 'sectionresource') === resource.id &&
        related(r, 'user') === user
    );
    if (rec.length < 1) {
      logError(
        Severity.error,
        reporter,
        `unable to delete section resource user for mediaId=${mediaId}`
      );
      return;
    }
    memory.update((t: TransformBuilder) => t.removeRecord(rec[0]));
  };
};
