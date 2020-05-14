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
  //mediaFiles.forEach((m) =>
  //  console.log(related(m, 'plan'), planids.includes(related(m, 'plan')))
  //);
  var media = mediaFiles.filter((m) => planids.includes(related(m, 'plan')));
  console.log('media in plan', media.length);
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
