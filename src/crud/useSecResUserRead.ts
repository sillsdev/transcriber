import { useGlobal } from 'reactn';
import { QueryBuilder } from '@orbit/data';
import { SectionResource, SectionResourceUser } from '../model';
import { related } from '.';
import { logError, Severity } from '../utils';

export const useSecResUserRead = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [reporter] = useGlobal('errorReporter');

  return async (mediaId: string, res?: SectionResource) => {
    let resource = res;
    if (res === undefined) {
      const sectionresources = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('sectionresource')
      ) as SectionResource[];
      resource = sectionresources.find(
        (r) => related(r, 'mediafile') === mediaId
      );
    }
    if (!resource) {
      logError(
        Severity.error,
        reporter,
        `can't find section resource for mediaId=${mediaId}`
      );
      return null;
    }
    const sectionResourceUsers = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('sectionresourceuser')
    ) as SectionResourceUser[];
    const rec = sectionResourceUsers.filter(
      (r) =>
        related(r, 'sectionresource') === resource?.id &&
        related(r, 'user') === user
    );
    return rec.length > 0 ? rec[0] : null;
  };
};
