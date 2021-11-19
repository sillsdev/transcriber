import { IPassageDetailArtifactsStrings } from '../../../model';
import {
  ArtifactCategory,
  ArtifactType,
  MediaFile,
  SectionResource,
  SectionResourceUser,
} from '../../../model';
import { related } from '../../../crud';
import { IRow } from '../../../context/PassageDetailContext';

interface IProps {
  res: SectionResource[];
  mediafiles: MediaFile[];
  artifactTypes: ArtifactType[];
  categories: ArtifactCategory[];
  userResources: SectionResourceUser[];
  user: string;
  t: IPassageDetailArtifactsStrings;
}

export const resourceRows = ({
  res,
  mediafiles,
  artifactTypes,
  categories,
  userResources,
  user,
  t,
}: IProps) => {
  const newRow = Array<IRow>();
  res.forEach((r) => {
    const id = related(r, 'mediafile');
    const media = mediafiles.find((m) => m.id === id);
    const mediaAttr = media?.attributes;
    const typId = related(media, 'artifactType');
    const artifactType = artifactTypes.find((t) => t.id === typId);
    const typeNameSlug = artifactType?.attributes?.typename || '';
    const catId = related(media, 'artifactCategory');
    const category = categories.find((c) => c.id === catId);
    const catNameSlug = category?.attributes?.categoryname || '';
    const done = Boolean(
      userResources.find((u) => related(u, r.id) && related(u, user))
    );
    newRow.push({
      id,
      playItem: '',
      sequenceNum: r.attributes.sequenceNum,
      version: mediaAttr?.versionNumber || 0,
      artifactName: r.attributes.description || mediaAttr?.originalFile || '',
      artifactType: t.getString(typeNameSlug) || typeNameSlug,
      artifactCategory: t.getString(catNameSlug) || catNameSlug,
      done,
      mediafile: media || ({} as MediaFile),
    });
  });
  return newRow;
};
