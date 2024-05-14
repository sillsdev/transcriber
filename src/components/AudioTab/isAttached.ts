import { Passage, MediaFile } from '../../model';
import { related } from '../../crud/related';

export const isAttached = (p: Passage, media: MediaFile[]) => {
  return media.filter((m) => related(m, 'passage') === p.id).length > 0;
};
