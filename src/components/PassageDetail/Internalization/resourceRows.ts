import {
  ArtifactCategory,
  ArtifactType,
  MediaFileD,
  SectionResourceD,
  SectionResourceUser,
} from '../../../model';
import { related, VernacularTag } from '../../../crud';
import { IRow } from '../../../context/PassageDetailContext';
import { isVisual, removeExtension } from '../../../utils';

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
  r: SectionResourceD | null;
  media: MediaFileD | undefined;
  sourceversion: number;
}

export const oneMediaRow = ({
  newRow,
  r,
  media,
  sourceversion,
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
    artifactName:
      r?.attributes.description ||
      removeExtension(mediaAttr?.originalFile || '').name,
    artifactType: localizedType(typeNameSlug),
    artifactCategory: localizedCategory(catNameSlug),
    done,
    editAction: null,
    mediafile: media || ({} as MediaFileD),
    resource: r,
    isResource: isResource(typeNameSlug),
    passageId: (r ? related(r, 'passage') : related(media, 'passage')) || '',
    isComment: typeNameSlug === 'comment',
    isKeyTerm: typeNameSlug === 'keyterm',
    isVernacular: typeNameSlug === '' || typeNameSlug === 'vernacular',
    isText: isVisual(media),
    sourceVersion: sourceversion,
  });
  return newRow;
};

interface MediaProps extends DataProps {
  mediafiles: MediaFileD[];
}

export const mediaRows = (props: MediaProps) => {
  const { mediafiles, artifactTypes } = props;

  const newRow = new Array<IRow>();
  // sort takes the greatest version but if they're equal, keeps the
  // one loaded first which is the vernacular media
  mediafiles
    .filter((m) => m?.attributes?.versionNumber !== undefined)
    .sort((i, j) => {
      const iType = related(i, 'artifactType');
      const jType = related(j, 'artifactType');
      const icmt = iType !== VernacularTag;
      const jcmt = jType !== VernacularTag;
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
      let sourceversion = 0;
      const relatedMedia = related(media, 'sourceMedia');
      if (relatedMedia) {
        var m = mediafiles.find((m) => m.id === relatedMedia);
        sourceversion = m?.attributes?.versionNumber || 0;
      }
      if (!isResource(typeNameSlug))
        oneMediaRow({ ...props, newRow, r: null, media, sourceversion });
    });
  return newRow;
};

interface IProps extends DataProps {
  res: SectionResourceD[];
  mediafiles: MediaFileD[];
}

export const resourceRows = (props: IProps) => {
  const { res, mediafiles } = props;
  const newRow = Array<IRow>();
  res.forEach((r) => {
    const id = related(r, 'mediafile');
    const media = mediafiles.find((m) => m.id === id);
    oneMediaRow({ ...props, newRow, r, media, sourceversion: 0 });
  });
  return newRow;
};
