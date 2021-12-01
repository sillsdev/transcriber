import { MediaFile } from '../model';
import { getMediaInPlans, related, useArtifactType } from '.';

export const useMediaCounts = (plan: string, mediafiles: MediaFile[]) => {
  const { vernacularId } = useArtifactType();
  const planMedia = (
    plan ? getMediaInPlans([plan], mediafiles, vernacularId, true) : []
  ) as MediaFile[];
  const attached = planMedia
    .map((m) => related(m, 'passage'))
    .filter((p) => p && p !== '');
  const transcribed = planMedia
    .map((m) => m.attributes.transcription)
    .filter((t) => t && t !== '');

  return [planMedia, attached, transcribed];
};
