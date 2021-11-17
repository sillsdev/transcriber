import { MediaFile, SectionResource } from '../../../model';
import { related } from '../../../crud';

export const getResources = (
  sectionResources: SectionResource[],
  mediafiles: MediaFile[],
  sectionId: string
) => {
  return sectionResources
    .filter((s) => mediafiles.find((m) => m.id === related(s, 'mediafile')))
    .filter((s) => related(s, 'section') === sectionId)
    .sort((p, q) =>
      p.attributes.sequenceNum > q.attributes.sequenceNum ? 1 : -1
    );
};
