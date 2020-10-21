import { MediaFile } from '../model';
import { related } from '.';

interface ILatest {
  [planName: string]: number;
}
export const getMediaInPlans = (
  planids: Array<string>,
  mediaFiles: Array<MediaFile>
) => {
  const latest: ILatest = {};
  var media = mediaFiles.filter((m) => planids.includes(related(m, 'plan')));
  media.forEach((f) => {
    const name = related(f, 'plan') + f.attributes.originalFile;
    latest[name] = latest[name]
      ? Math.max(latest[name], f.attributes.versionNumber)
      : f.attributes.versionNumber;
  });
  return media.filter(
    (f) =>
      latest[related(f, 'plan') + f.attributes.originalFile] ===
      f.attributes.versionNumber
  );
};
