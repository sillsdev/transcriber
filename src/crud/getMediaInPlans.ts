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
  onlyTypeId: string | null | undefined, // null for vernacular
  onlyLatest: boolean
) => {
  const latest: ILatest = {};
  var media = mediaFiles.filter(
    (m) => planids.indexOf(related(m, 'plan')) >= 0
  );
  if (onlyTypeId !== undefined) {
    media = media.filter((m) => related(m, 'artifactType') === onlyTypeId);
  }
  if (onlyLatest) {
    if (onlyTypeId === VernacularTag) {
      media
        .filter((m) => related(m, 'passage'))
        .forEach((f) => {
          const name = versionName(f);
          latest[name] = latest[name]
            ? Math.max(latest[name], f.attributes.versionNumber)
            : f.attributes.versionNumber;
        });
      return media.filter(
        (f) => latest[versionName(f)] === f.attributes.versionNumber
      );
    } else {
      var myMedia = media;
      var vernacularIds = getMediaInPlans(
        planids,
        mediaFiles,
        VernacularTag,
        true
      ).map((m) => m.id);
      media = myMedia.filter(
        (m) => vernacularIds.indexOf(related(m, 'sourceMedia')) >= 0
      );
    }
  }
  return media;
};
