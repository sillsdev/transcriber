import { useGlobal } from 'reactn';
import { Operation, TransformBuilder } from '@orbit/data';
import { SharedResourceReference, SharedResource } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { BookRef, Passage } from '../model';
import { parseRef } from './passage';
import { rangeSort } from '../utils';

const newRange = (p: Passage) =>
  p.endVerse ? `${p.startVerse}-${p.endVerse}` : `${p.startVerse}`;

export const useShaRefCreate = (sharedResource: SharedResource) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (bookRefs: BookRef[]) => {
    const t = new TransformBuilder();
    let ops: Operation[] = [];
    for (const bookRef of bookRefs) {
      const chapRefs = bookRef.refs.replace(/\s*/g, '').split(';');
      const chapMap = new Map<number, string>();
      for (const chapRef of chapRefs) {
        const p: Passage = {
          attributes: {
            reference: chapRef,
          },
        } as any;
        parseRef(p);
        if (p.startChapter && p.startVerse) {
          if (chapMap.has(p.startChapter)) {
            const ranges = chapMap.get(p.startChapter)?.split(';');
            if (ranges) {
              const newRanges = ranges.concat([newRange(p)]).sort(rangeSort);
              chapMap.set(p.endChapter as number, newRanges.join(';'));
            }
          } else {
            chapMap.set(p.endChapter as number, newRange(p));
          }
        }
      }
      for (const [chapter, refs] of Array.from(chapMap.entries())) {
        const shaRefRec: SharedResourceReference = {
          type: 'sharedresourcereference',
          attributes: {
            book: bookRef.code,
            chapter: chapter,
            verseRanges: refs,
          },
        } as SharedResourceReference;
        memory.schema.initializeRecord(shaRefRec);
        ops = ops.concat([
          ...AddRecord(t, shaRefRec, user, memory),
          ...ReplaceRelatedRecord(
            t,
            shaRefRec,
            'sharedResource',
            'sharedresource',
            sharedResource.id
          ),
        ]);
      }
    }
    await memory.update(ops);
  };
};
