import { useGlobal } from 'reactn';
import { SectionResourceD } from '../model';
import { related } from '.';

export const useSecResDelete = () => {
  const [memory] = useGlobal('memory');

  return async (secResRec: SectionResourceD) => {
    const mediaId = related(secResRec, 'mediafile');
    const mediaRecId = { type: 'mediafile', id: mediaId };
    await memory.update((t) => t.removeRecord(secResRec));
    await memory.update((t) => t.removeRecord(mediaRecId));
  };
};
