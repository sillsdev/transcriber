import { useGlobal } from 'reactn';
import { SectionResourceD, SectionResourceUserD } from '../model';
import { related } from '.';

export const useSecResUserRead = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (resource: SectionResourceD) => {
    const sectionResourceUsers = memory.cache.query((q) =>
      q.findRecords('sectionresourceuser')
    ) as SectionResourceUserD[];
    const rec = sectionResourceUsers.filter(
      (r) =>
        related(r, 'sectionresource') === resource.id &&
        related(r, 'user') === user
    );
    return rec.length > 0 ? rec[0] : null;
  };
};
