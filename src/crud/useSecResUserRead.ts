import { useGlobal } from '../mods/reactn';
import { QueryBuilder } from '@orbit/data';
import { SectionResource, SectionResourceUser } from '../model';
import { related } from '.';

export const useSecResUserRead = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (resource: SectionResource) => {
    const sectionResourceUsers = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('sectionresourceuser')
    ) as SectionResourceUser[];
    const rec = sectionResourceUsers.filter(
      (r) =>
        related(r, 'sectionresource') === resource.id &&
        related(r, 'user') === user
    );
    return rec.length > 0 ? rec[0] : null;
  };
};
