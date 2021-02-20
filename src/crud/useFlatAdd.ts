import { useGlobal } from 'reactn';
import { Passage, MediaFile, ActivityStates, ISharedStrings } from '../model';
import { QueryBuilder } from '@orbit/data';
import { remoteIdGuid, saveNewSection, AddFlatPassage } from '.';

export const useFlatAdd = (ts: ISharedStrings) => {
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
    const total = mediaRemoteIds.length;
    for (let seq = 0; seq < total; seq++) {
      if (setComplete) setComplete(Math.floor((100.0 * seq) / total));
      const mediaRemoteId = mediaRemoteIds[seq];
      const mediaId =
        remoteIdGuid('mediafile', mediaRemoteId, memory.keyMap) ||
        mediaRemoteId;
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
          user,
        });
        const passage: Passage = {
          type: 'passage',
          attributes: {
            sequencenum: seq + 1,
            book: book,
            reference: ts.part.replace('{0}', (seq + 1).toString()),
            title: '',
            position: 0,
            hold: false,
            state: ActivityStates.TranscribeReady,
          },
        } as any;
        await memory.update(
          AddFlatPassage(passage, secRec, planId, mediaRec[0], user, memory)
        );
      }
    }
    await memory.update((t) =>
      t.replaceAttribute({ type: 'plan', id: planId }, 'sectionCount', total)
    );
    if (setComplete) setComplete(0);
  };
};
