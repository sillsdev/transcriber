import { Plan, MediaFile } from '../model';
import { related } from '.';

interface ILatest {
  [planName: string]: number;
}
export const getMediaInPlans = (
  plans: Array<Plan>,
  mediaFiles: Array<MediaFile>
) => {
  const latest: ILatest = {};
  var planids = plans.map((p) => p.id);
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
