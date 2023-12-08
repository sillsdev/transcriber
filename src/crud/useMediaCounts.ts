import { MediaFileD } from '../model';
import { getMediaInPlans, related, VernacularTag } from '.';

export const useMediaCounts = (plan: string, mediafiles: MediaFileD[]) => {
  const planMedia = (
    plan ? getMediaInPlans([plan], mediafiles, VernacularTag, true) : []
  ) as MediaFileD[];
  const attached = planMedia
    .map((m) => related(m, 'passage'))
    .filter((p) => p && p !== '');
  const transcribed = planMedia
    .map((m) => m.attributes.transcription)
    .filter((t) => t && t !== '');

  return [planMedia, attached, transcribed];
};
