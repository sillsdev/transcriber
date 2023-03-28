import { Button, ButtonGroup, Stack } from '@mui/material';
import { useShaRefCreate } from '../../crud/useShaRefCreate';
import { useShaRefDelete } from '../../crud/useShaRefDelete';
import { useShaRefRead } from '../../crud/useShaRefRead';
import { useShaRefUpdate } from '../../crud/useShaRefUpdate';
import {
  BookRef,
  SharedResource,
  SharedResourceReference,
  IResourceStrings,
} from '../../model';
import ReferenceTable from './ResRefTable';
import { rangeAdd, useBookN } from '../../utils';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedResourceSelector } from '../../selector';
import { related } from '../../crud';

interface RecordProps {
  sharedResourceReferences: SharedResourceReference[];
}

interface ResourceRefsProps {
  res?: SharedResource;
  onOpen: () => void;
}

export function ResourceRefs({
  res,
  onOpen,
  sharedResourceReferences,
}: ResourceRefsProps & RecordProps) {
  const readShaRefRecs = useShaRefRead();
  const createShaRefRecs = useShaRefCreate(res || ({} as SharedResource));
  const updateShaRefRecs = useShaRefUpdate();
  const deleteShaRefRecs = useShaRefDelete();
  const bookN = useBookN();
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  const handleAddWord = () => {};

  const handleCommit = (refs: BookRef[]) => {
    console.log(JSON.stringify(refs, null, 2));
    const shaRefRecs = readShaRefRecs(res?.id || '');
    if (shaRefRecs.length === 0) {
      createShaRefRecs(refs);
    } else {
      const updRecIds = new Map<string, string>();
      const bookMap = new Map<string, string>();
      refs.forEach((r) => {
        const chapSpec = r.refs.replace(/\s*/g, '').split(';');
        chapSpec.forEach((c) => {
          const chapter = parseInt(c);
          const rec = shaRefRecs.find(
            (sr) =>
              sr.attributes.book === r.code && sr.attributes.chapter === chapter
          );
          if (rec) {
            if (!updRecIds.has(rec.id))
              updRecIds.set(rec.id, rec.attributes.verses);
            const m = /\d+:(.*)$/.exec(c);
            if (m) {
              const ranges = m[1].split(',');
              for (const range of ranges) {
                const m1 = /(\d+)(?:-(\d+))?/.exec(range);
                if (m1) {
                  const start = m1[1];
                  const end = m1[2];
                  rec.attributes.verses = rangeAdd(
                    rec.attributes.verses,
                    start,
                    end
                  );
                }
              }
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
      const updRecs = shaRefRecs.filter(
        (sr) =>
          updRecIds.has(sr.id) && updRecIds.get(sr.id) !== sr.attributes.verses
      );
      if (updRecs.length > 0) updateShaRefRecs(updRecs);
      const addRefs = Array.from(bookMap).map(
        ([code, refs]) => ({ code, refs } as BookRef)
      );
      if (addRefs.length > 0) createShaRefRecs(addRefs);
      const delRecs = shaRefRecs.filter((sr) => !updRecIds.has(sr.id));
      if (delRecs.length > 0) deleteShaRefRecs(delRecs);
    }
  };
  const handleCancel = () => onOpen();

  const dataSort = (i: SharedResourceReference, j: SharedResourceReference) => {
    const iBook = bookN(i.attributes.book);
    const jBook = bookN(j.attributes.book);
    const bookDiff = iBook - jBook;
    return bookDiff < 0
      ? -1
      : bookDiff > 0
      ? 1
      : i.attributes.chapter - j.attributes.chapter;
  };

  const collapseRefs = (chapter: number, verseText: string) => {
    const verses = verseText.split(',').map((v) => parseInt(v));
    let result = `${chapter}`;
    if (verseText !== '') {
      result += `: ${verses[0]}`;
      let isRange = false;
      let last = verses[0];
      for (let i = 1; i < verses.length; i += 1) {
        if (verses[i] === last + 1) {
          last = verses[i];
          isRange = true;
        } else {
          if (isRange) {
            result += `-${last}`;
            isRange = false;
          }
          last = verses[i];
          result += `, ${last}`;
        }
      }
      if (isRange) result += `-${last}`;
    }
    return result;
  };

  const bookSort = (i: BookRef, j: BookRef) => bookN(i.code) - bookN(j.code);

  const bookData = React.useMemo(() => {
    const books = new Map<string, string>();
    sharedResourceReferences
      .filter((sr) => related(sr, 'sharedResource') === (res?.id || ''))
      .sort(dataSort)
      .map((sr) => ({
        code: sr.attributes.book,
        refs: collapseRefs(sr.attributes.chapter, sr.attributes.verses),
      }))
      .forEach(({ code, refs }) => {
        if (books.has(code)) {
          books.set(code, `${books.get(code)}; ${refs}`);
        } else {
          books.set(code, refs);
        }
      });
    return Array.from(books)
      .map(([code, refs]) => ({ code, refs }))
      .sort(bookSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedResourceReferences, res?.id]);

  return (
    <Stack spacing={1}>
      <ButtonGroup>
        <Button onClick={handleAddWord}>{t.byWord}</Button>
      </ButtonGroup>
      <ReferenceTable
        bookData={bookData}
        onCommit={handleCommit}
        onCancel={handleCancel}
      />
    </Stack>
  );
}

const mapRecordsToProps = {
  sharedResourceReferences: (q: QueryBuilder) =>
    q.findRecords('sharedresourcereference'),
};

export default withData(mapRecordsToProps)(ResourceRefs as any) as any as (
  props: ResourceRefsProps
) => JSX.Element;
