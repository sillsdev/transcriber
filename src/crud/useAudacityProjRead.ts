import { useGlobal } from 'reactn';
import { AudacityProjectD } from '../model';
import { related } from '.';

export const useAudacityProjRead = () => {
  const [memory] = useGlobal('memory');

  return (passageId: string) => {
    const audacityProjectRecs = memory.cache.query((q) =>
      q.findRecords('audacityproject')
    ) as AudacityProjectD[];
    const selected = audacityProjectRecs.filter(
      (o) => related(o, 'passage') === passageId
    );
    return selected.length > 0 ? selected[0] : ({} as AudacityProjectD);
  };
};
