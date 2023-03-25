import { Button, ButtonGroup, Stack } from '@mui/material';
import { useShaRefCreate } from '../../crud/useShaRefCreate';
import { useShaRefDelete } from '../../crud/useShaRefDelete';
import { useShaRefRead } from '../../crud/useShaRefRead';
import { useShaRefUpdate } from '../../crud/useShaRefUpdate';
import { BookRef, SharedResource } from '../../model';
import ReferenceTable from './ResRefTable';
import { rangeSort } from '../../utils';

const t = {
  byWord: 'By Word',
};

const chapKey = (book: string, chapter: number) => `${book} ${chapter}`;

interface ResourceRefsProps {
  res?: SharedResource;
  onOpen: () => void;
}

export default function ResourceRefs({ res, onOpen }: ResourceRefsProps) {
  const readShaRefRecs = useShaRefRead();
  const createShaRefRecs = useShaRefCreate(res || ({} as SharedResource));
  const updateShaRefRecs = useShaRefUpdate(res || ({} as SharedResource));
  const deleteShaRefRecs = useShaRefDelete();

  const handleAddWord = () => {};

  const handleCommit = (refs: BookRef[]) => {
    console.log(JSON.stringify(refs, null, 2));
    const shaRefRecs = readShaRefRecs(res?.id || '');
    if (shaRefRecs.length === 0) {
      createShaRefRecs(refs);
    } else {
      const chapSet = new Set<string>();
      const updRecIds = new Set<string>();
      const bookMap = new Map<string, string>();
      refs.forEach((r) => {
        const chapSpec = r.refs.replace(/\s*/g, '').split(';');
        chapSpec.forEach((c) => {
          const chapter = parseInt(c);
          chapSet.add(chapKey(r.code, chapter)); // don't delete
          const rec = shaRefRecs.find(
            (sr) =>
              sr.attributes.book === r.code && sr.attributes.chapter === chapter
          );
          if (rec) {
            const m = /\d+:(.*)$/.exec(c);
            const newRange = m?.groups && m.groups[1];
            if (newRange) {
              updRecIds.add(rec.id);
              const ranges = rec.attributes.verseRanges
                .split(';')
                .concat([newRange])
                .sort(rangeSort);
              rec.attributes.verseRanges = ranges.join(';');
            }
          } else {
            if (bookMap.has(r.code)) {
              const refs = bookMap.get(r.code);
              bookMap.set(r.code, `${refs};${c}`);
            } else {
              bookMap.set(r.code, c);
            }
          }
        });
      });
      const updRecs = shaRefRecs.filter((sr) => updRecIds.has(sr.id));
      updateShaRefRecs(updRecs);
      const addRefs = Array.from(bookMap).map(
        ([code, refs]) => ({ code, refs } as BookRef)
      );
      createShaRefRecs(addRefs);
      const delRecs = shaRefRecs.filter(
        (sr) => !chapSet.has(chapKey(sr.attributes.book, sr.attributes.chapter))
      );
      deleteShaRefRecs(delRecs);
    }
  };
  const handleCancel = () => onOpen();

  return (
    <Stack spacing={1}>
      <ButtonGroup>
        <Button onClick={handleAddWord}>{t.byWord}</Button>
      </ButtonGroup>
      <ReferenceTable onCommit={handleCommit} onCancel={handleCancel} />
    </Stack>
  );
}
