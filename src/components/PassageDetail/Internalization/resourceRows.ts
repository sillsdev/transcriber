import {
  ArtifactCategory,
  ArtifactType,
  MediaFile,
  SectionResource,
  SectionResourceUser,
} from '../../../model';
import { related } from '../../../crud';
import { IRow } from '../../../context/PassageDetailContext';

const isResource = (typeSlug: string) =>
  ['resource', 'sharedresource'].indexOf(typeSlug) !== -1;

interface DataProps {
  artifactTypes: ArtifactType[];
  categories: ArtifactCategory[];
  userResources: SectionResourceUser[];
  user: string;
  localizedCategory: (slug: string) => string;
  localizedType: (slug: string) => string;
}

interface RowProps extends DataProps {
  newRow: IRow[];
  r: SectionResource | null;
  media: MediaFile | undefined;
}

export const oneMediaRow = ({
  newRow,
  r,
  media,
  artifactTypes,
  categories,
  userResources,
  user,
  localizedCategory,
  localizedType,
}: RowProps) => {
  const mediaAttr = media?.attributes;
  const typId = related(media, 'artifactType');
  const artifactType = artifactTypes.find((t) => t.id === typId);
  const typeNameSlug = artifactType?.attributes?.typename || '';
  const catId = related(media, 'artifactCategory');
  const category = categories.find((c) => c.id === catId);
  const catNameSlug = category?.attributes?.categoryname || '';
  const done = Boolean(
    r &&
      userResources.find(
        (u) =>
          related(u, 'sectionresource') === r.id && related(u, 'user') === user
      )
  );

  newRow.push({
    id: media?.id || '',
    playItem: '',
    sequenceNum: r?.attributes.sequenceNum || 0,
    version: mediaAttr?.versionNumber || 0,
    artifactName: r?.attributes.description || mediaAttr?.originalFile || '',
    artifactType: localizedType(typeNameSlug),
    artifactCategory: localizedCategory(catNameSlug),
    done,
    editAction: null,
    mediafile: media || ({} as MediaFile),
    resource: r,
    isResource: isResource(typeNameSlug),
    isComment: typeNameSlug === 'comment',
  });
  return newRow;
};

interface MediaProps extends DataProps {
  mediafiles: MediaFile[];
}

export const mediaRows = (props: MediaProps) => {
  const { mediafiles, artifactTypes } = props;

  const newRow = Array<IRow>();
  // sort takes the greatest version but if their equal, keeps the
  // one loaded first which is the vernacular media
  mediafiles
    .sort((i, j) => {
      const icmt = Boolean(related(i, 'artifactType'));
      const jcmt = Boolean(related(j, 'artifactType'));
      return !icmt && jcmt
        ? -1
        : icmt && !jcmt
        ? 1
        : j.attributes.versionNumber - i.attributes.versionNumber;
    })
    .forEach((media) => {
      const typId = related(media, 'artifactType');
      const artifactType = artifactTypes.find((t) => t.id === typId);
      const typeNameSlug = artifactType?.attributes?.typename || '';
      if (!isResource(typeNameSlug))
        oneMediaRow({ ...props, newRow, r: null, media });
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
    oneMediaRow({ ...props, newRow, r, media });
  });
  return newRow;
};
