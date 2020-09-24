import { useGlobal } from 'reactn';
import { Passage, MediaFile, ActivityStates } from '../model';
import { QueryBuilder } from '@orbit/data';
import { remoteIdGuid, saveNewSection, remoteIdNum, AddFlatPassage } from '.';

export const useFlatAdd = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (
    planId: string,
    mediaRemoteIds: string[],
    book: string | undefined,
    setComplete?: (amt: number) => void
  ) => {
    const mediaRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('mediafile')
    ) as MediaFile[];
    const userId = remoteIdNum('user', user, memory.keyMap);
    const total = mediaRemoteIds.length;
    for (let seq = 0; seq < total; seq++) {
      if (setComplete) setComplete(Math.floor((100.0 * seq) / total));
      const mediaRemoteId = mediaRemoteIds[seq];
      const mediaId = remoteIdGuid('mediafile', mediaRemoteId, memory.keyMap);
      const mediaRec = mediaRecs.filter((m) => m.id === mediaId);
      if (mediaRec.length > 0) {
        const mediaAttr = mediaRec[0].attributes;
        const originalName = mediaAttr.originalFile;
        const name =
          (originalName && originalName.split('.')[0]) || `Section ${seq}`;
        const plan = { type: 'plan', id: planId };
        const secRec = await saveNewSection({
          sequencenum: seq + 1,
          name,
          plan,
          memory,
          userId,
        });
        const passage: Passage = {
          type: 'passage',
          attributes: {
            sequencenum: seq + 1,
            book: book,
            reference: `Part ${seq + 1}`,
            title: '',
            position: 0,
            hold: false,
            state: ActivityStates.TranscribeReady,
          },
        } as any;
        await memory.update(
          AddFlatPassage(passage, secRec, planId, mediaRec[0], userId, memory)
        );
      }
    }
    await memory.update((t) =>
      t.replaceAttribute({ type: 'plan', id: planId }, 'sectionCount', total)
    );
    if (setComplete) setComplete(0);
  };
};
