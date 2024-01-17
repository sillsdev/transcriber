import { related } from '.';
import { ActivityStates, MediaFile, Passage } from '../model';
import { useOrbitData } from '../hoc/useOrbitData';

export const usePassageState = () => {
  const media = useOrbitData<MediaFile[]>('mediafile');

  return (passage: Passage) => {
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
    else
      return (
        vernmedia[0].attributes?.transcriptionstate ||
        ActivityStates.TranscribeReady
      );
  };
};
