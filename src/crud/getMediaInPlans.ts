import { MediaFile } from '../model';
import { related, VernacularTag } from '.';

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
  onlyTypeId: string | null | undefined // null for vernacular
) => {
  const latest: ILatest = {};
  var media = mediaFiles.filter(
    (m) => planids.indexOf(related(m, 'plan')) >= 0
  );
  if (onlyTypeId !== undefined) {
    media = media.filter((m) => related(m, 'artifactType') === onlyTypeId);
  }
  if (onlyTypeId === VernacularTag) {
    media.forEach((f) => {
      const name = versionName(f);
      latest[name] = latest[name]
        ? Math.max(latest[name], f.attributes.versionNumber)
        : f.attributes.versionNumber;
    });
    return media.filter(
      (f) => latest[versionName(f)] === f.attributes.versionNumber
    );
  } else return media;
};
