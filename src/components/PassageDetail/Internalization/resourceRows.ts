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

interface DataProps {
  artifactTypes: ArtifactType[];
  categories: ArtifactCategory[];
  userResources: SectionResourceUser[];
  user: string;
  t: IPassageDetailArtifactsStrings;
}

interface RowProps extends DataProps {
  newRow: IRow[];
  r: SectionResource | null;
  media: MediaFile | undefined;
}

const oneRow = ({
  newRow,
  r,
  media,
  artifactTypes,
  categories,
  userResources,
  user,
  t,
}: RowProps) => {
  const mediaAttr = media?.attributes;
  const typId = related(media, 'artifactType');
  const artifactType = artifactTypes.find((t) => t.id === typId);
  const typeNameSlug = artifactType?.attributes?.typename || '';
  const catId = related(media, 'artifactCategory');
  const category = categories.find((c) => c.id === catId);
  const catNameSlug = category?.attributes?.categoryname || '';
  const done = Boolean(
    r && userResources.find((u) => related(u, r.id) && related(u, user))
  );
  newRow.push({
    id: media?.id || '',
    playItem: '',
    sequenceNum: r?.attributes.sequenceNum || 0,
    version: mediaAttr?.versionNumber || 0,
    artifactName: r?.attributes.description || mediaAttr?.originalFile || '',
    artifactType: t.getString(typeNameSlug) || typeNameSlug,
    artifactCategory: t.getString(catNameSlug) || catNameSlug,
    done,
    editAction: null,
    mediafile: media || ({} as MediaFile),
  });
  return newRow;
};

interface MediaProps extends DataProps {
  mediafiles: MediaFile[];
  isResource: (typeSlug: string) => boolean;
}

export const mediaRows = (props: MediaProps) => {
  const { mediafiles, artifactTypes, isResource } = props;

  const newRow = Array<IRow>();
  mediafiles
    .sort((i, j) =>
      i.attributes.versionNumber > j.attributes.versionNumber ? -1 : 1
    )
    .forEach((media) => {
      const typId = related(media, 'artifactType');
      const artifactType = artifactTypes.find((t) => t.id === typId);
      const typeNameSlug = artifactType?.attributes?.typename || '';
      if (!isResource(typeNameSlug))
        oneRow({ ...props, newRow, r: null, media });
    });
  return newRow;
};

interface IProps extends DataProps {
  res: SectionResource[];
  mediafiles: MediaFile[];
}

export const resourceRows = (props: IProps) => {
  const { res, mediafiles } = props;
  const newRow = Array<IRow>();
  res.forEach((r) => {
    const id = related(r, 'mediafile');
    const media = mediafiles.find((m) => m.id === id);
    oneRow({ ...props, newRow, r, media });
  });
  return newRow;
};
