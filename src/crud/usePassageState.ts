import { QueryBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { related } from '.';
import { ActivityStates, MediaFile, Passage } from '../model';

export const usePassageState = () => {
  const [memory] = useGlobal('memory');

  return (passage: Passage) => {
    const media = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('mediafile')
    ) as MediaFile[];
    var vernmedia = media
      .filter(
        (m) =>
          related(m, 'passage') === passage.id &&
          related(m, 'artifactType') === null
      )
      .sort(
        (a, b) => b.attributes?.versionNumber - a.attributes?.versionNumber
      );
    if (vernmedia.length === 0) return ActivityStates.NoMedia;
    else return vernmedia[0].attributes?.transcriptionstate || '';
  };
};
