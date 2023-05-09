import { useGlobal } from 'reactn';
import { Operation, TransformBuilder } from '@orbit/data';
import { SharedResourceReference, SharedResource } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { BookRef } from '../model';
import { rangeAdd } from '../utils';

const chapKey = (book: string, chapter: string) => `${book} ${chapter}`;
const chapPat = /(\d+):?(.*)/;
const rangePat = /(\d+)(?:-(\d+))?/;

export const useShaRefCreate = (sharedResource: SharedResource) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (bookRefs: BookRef[]) => {
    const t = new TransformBuilder();
    let ops: Operation[] = [];
    const chapMap = new Map<string, string>();
    for (const bookRef of bookRefs) {
      const chapRefs = bookRef.refs.replace(/\s*/g, '').split(';');
      for (const chapRef of chapRefs) {
        const m = chapPat.exec(chapRef);
        if (m) {
          const chapter = m[1];
          const ranges = m[2];
          const key = chapter ? chapKey(bookRef.code, chapter) : bookRef.code;
          if (ranges) {
            for (const range of ranges.split(',')) {
              const m1 = rangePat.exec(range);
              if (m1) {
                const start = m1[1];
                const end = m1[2];
                chapMap.set(key, rangeAdd(chapMap.get(key), start, end));
              }
            }
          } else {
            chapMap.set(key, '');
          }
        }
      }
    }
    for (const [key, refs] of Array.from(chapMap.entries())) {
      const [code, chapter] = key.split(' ');
      const shaRefRec: SharedResourceReference = {
        type: 'sharedresourcereference',
        attributes: {
          book: code,
          chapter: chapter ? parseInt(chapter) : undefined,
          verses: refs,
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
    await memory.update(ops);
  };
};
