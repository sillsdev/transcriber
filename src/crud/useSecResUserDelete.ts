import { useGlobal } from 'reactn';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { SectionResource, SectionResourceUser } from '../model';
import { related } from '.';
import { logError, Severity } from '../utils';

export const useSecResUserDelete = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [reporter] = useGlobal('errorReporter');

  return async (resource: SectionResource, resUser?: SectionResourceUser) => {
    if (resUser) {
      memory.update((t: TransformBuilder) => t.removeRecord(resUser));
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
        `unable to delete section resource user for resourceId=${resource.id}`
      );
      return;
    }
    memory.update((t: TransformBuilder) => t.removeRecord(rec[0]));
  };
};
