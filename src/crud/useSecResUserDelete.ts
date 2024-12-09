import { useGlobal } from '../context/GlobalContext';
import { SectionResourceD, SectionResourceUserD } from '../model';
import { related } from '.';
import { logError, Severity } from '../utils';

export const useSecResUserDelete = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [reporter] = useGlobal('errorReporter');

  return async (resource: SectionResourceD, resUser?: SectionResourceUserD) => {
    if (resUser) {
      memory.update((t) => t.removeRecord(resUser));
      return;
    }
    const sectionResourceUsers = memory?.cache.query((q) =>
      q.findRecords('sectionresourceuser')
    ) as SectionResourceUserD[];
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
    memory.update((t) => t.removeRecord(rec[0]));
  };
};
