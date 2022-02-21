import { useGlobal } from 'reactn';
import { SectionResource } from '../model';
import { TransformBuilder } from '@orbit/data';
import { related } from '.';

export const useSecResDelete = () => {
  const [memory] = useGlobal('memory');

  return async (secResRec: SectionResource) => {
    const mediaId = related(secResRec, 'mediafile');
    const mediaRecId = { type: 'mediafile', id: mediaId };
    await memory.update((t: TransformBuilder) => t.removeRecord(secResRec));
    await memory.update((t: TransformBuilder) => t.removeRecord(mediaRecId));
  };
};
