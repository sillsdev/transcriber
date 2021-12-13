import { MediaFile } from '../model';
import { related } from '.';

interface ILatest {
  [planName: string]: number;
}
const versionName = (mf: MediaFile) => {
  const psg = related(mf, 'passage');
  if (psg) return psg;
  return related(mf, 'plan') + mf.attributes.originalFile;
};
export const getMediaInPlans = (
  planids: Array<string>,
  mediaFiles: Array<MediaFile>,
  onlyTypeId: string | undefined,
  nullTypeId: boolean
) => {
  const latest: ILatest = {};
  var media = mediaFiles.filter(
    (m) => planids.indexOf(related(m, 'plan')) >= 0
  );
  if (onlyTypeId) {
    media = media.filter(
      (m) =>
        related(m, 'artifactType') === onlyTypeId ||
        (nullTypeId ? related(m, 'artifactType') === null : false)
    );
  }
  media.forEach((f) => {
    const name = versionName(f);
    latest[name] = latest[name]
      ? Math.max(latest[name], f.attributes.versionNumber)
      : f.attributes.versionNumber;
  });
  return media.filter(
    (f) => latest[versionName(f)] === f.attributes.versionNumber
  );
};
