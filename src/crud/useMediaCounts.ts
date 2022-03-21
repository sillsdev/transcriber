import { MediaFile } from '../model';
import { getMediaInPlans, related, VernacularTag } from '.';

export const useMediaCounts = (plan: string, mediafiles: MediaFile[]) => {
  const planMedia = (
    plan ? getMediaInPlans([plan], mediafiles, VernacularTag, true) : []
  ) as MediaFile[];
  const attached = planMedia
    .map((m) => related(m, 'passage'))
    .filter((p) => p && p !== '');
  const transcribed = planMedia
    .map((m) => m.attributes.transcription)
    .filter((t) => t && t !== '');

  return [planMedia, attached, transcribed];
};
