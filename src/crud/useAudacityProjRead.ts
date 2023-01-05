import { useGlobal } from '../mods/reactn';
import { AudacityProject } from '../model';
import { QueryBuilder } from '@orbit/data';
import { related } from '.';

export const useAudacityProjRead = () => {
  const [memory] = useGlobal('memory');

  return (passageId: string) => {
    const audacityProjectRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('audacityproject')
    ) as AudacityProject[];
    const selected = audacityProjectRecs.filter(
      (o) => related(o, 'passage') === passageId
    );
    return selected.length > 0 ? selected[0] : ({} as AudacityProject);
  };
};
