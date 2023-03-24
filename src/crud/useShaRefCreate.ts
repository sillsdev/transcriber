import { useGlobal } from 'reactn';
import { Operation, RecordIdentity, TransformBuilder } from '@orbit/data';
import { SharedResourceReference } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { BookRef, Passage } from '../model';
import { parseRef } from './passage';

interface IProps {
  bookRefs: BookRef[];
}

interface RefProps {
  sharedResource: RecordIdentity;
  category: string;
  cluster?: RecordIdentity;
}

const newRange = (p: Passage) =>
  p.endVerse ? `${p.startVerse}-${p.endVerse}` : `${p.startVerse}`;

const rangeSort = (i: string, j: string) =>
  parseInt(i) <= parseInt(j) ? -1 : 1;

export const useShaRefCreate = ({
  sharedResource,
  category, // artifactCategoryId
  cluster, // cluster organizationId
}: RefProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async ({ bookRefs }: IProps) => {
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
            'sharedResource',
            sharedResource.id
          ),
        ]);
        if (cluster) {
          ops.push(
            ...ReplaceRelatedRecord(
              t,
              shaRefRec,
              'cluster',
              'organization',
              cluster.id
            )
          );
        }
        if (category) {
          ops.push(
            ...ReplaceRelatedRecord(
              t,
              shaRefRec,
              'artifactCategory',
              'artifactcategory',
              category
            )
          );
        }
      }
    }
    await memory.update(ops);
  };
};
