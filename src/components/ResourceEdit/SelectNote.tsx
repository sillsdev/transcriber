import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArtifactCategoryD,
  IPassageDetailArtifactsStrings,
  IState,
  PassageD,
  SharedResource,
  SharedResourceD,
  SharedResourceReference,
} from '../../model';
import {
  findRecord,
  related,
  useArtifactCategory,
  useNotes,
  usePlanType,
} from '../../crud';
import { shallowEqual, useSelector } from 'react-redux';
import { passageDetailArtifactsSelector } from '../../selector';
import { useGlobal } from '../../context/GlobalContext';
import { OptionType } from '../BookSelect';
import PassageDataTable, { IRRow, RefLevel } from '../PassageDataTable';
import { useSnackBar } from '../../hoc/SnackBar';

interface IProps {
  passage?: PassageD;
  onOpen: (val: boolean) => void;
  onSelect?: (notes: SharedResourceD[]) => void;
}

export const SelectNote = (props: IProps) => {
  const { passage, onOpen, onSelect } = props;
  const [refLevel, setRefLevel] = useState<RefLevel>(RefLevel.All);
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const { getNotes, noteRefs, noteSource } = useNotes();
  const [notes, setNotes] = useState<SharedResourceD[]>([]);
  const [data, setData] = useState<IRRow[]>([]);
  const planType = usePlanType();
  const [bookCd, setBookCd] = useState<string>();
  const [bookOpt, setBookOpt] = useState<OptionType>();
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const [findRef, setFindRef] = useState('');
  const selecting = useRef(false);
  const { localizedArtifactCategory } = useArtifactCategory();
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const [value, setValue] = useState(-1);
  const { showMessage } = useSnackBar();

  const handleSelect = (checks: number[]) => {
    if (!selecting.current) {
      selecting.current = true;
      if (checks.length > 1) showMessage(t.selectOne);
      onSelect && onSelect(notes.filter((r, i) => checks.includes(i)));
      selecting.current = false;
      onOpen && onOpen(false);
    }
  };

  useEffect(() => {
    if (passage) {
      setBookCd(passage.attributes.book);
      setBookOpt(
        bookSuggestions.find((s) => s.value === passage.attributes.book)
      );
    }
    if (passage) {
      setFindRef(noteRefs(passage).join('; '));
      var srid = related(passage, 'sharedResource');
      if (srid && data.findIndex((r) => r.srid === srid) < 0) {
        setRefLevel(RefLevel.All);
      }
      setValue(data.findIndex((r) => r.srid === srid));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, data]);

  const refRes = useMemo(
    () => {
      const bookSet = new Set<string>();
      const chapSet = new Set<string>();
      const verseSet = new Set<string>();
      const addRes = (set: Set<string>, sr: SharedResourceReference) => {
        set.add(related(sr, 'sharedResource') as string);
      };
      const refRecs = (
        memory?.cache.query((q) =>
          q.findRecords('sharedresourcereference')
        ) as SharedResourceReference[]
      ).filter((srr) => {
        const sr = findRecord(
          memory,
          'sharedresource',
          related(srr, 'sharedResource')
        ) as SharedResource;
        return sr?.attributes?.note ?? false;
      });
      const bookRefs = refRecs.filter((r) => r.attributes.book === bookCd);
      bookRefs.forEach((b) => addRes(bookSet, b));
      const rangeList = findRef.split(';');
      rangeList.forEach((r) => {
        const m = /(\d+):?(\d*)-?(\d*)/.exec(r);
        if (m) {
          const chapRefs = bookRefs.filter(
            (r) => r.attributes.chapter === parseInt(m[1])
          );
          chapRefs.forEach((c) => addRes(chapSet, c));
          const startVerse = parseInt(m[2]);
          const endVerse = m[3] ? parseInt(m[3]) : startVerse;
          for (const cr of chapRefs) {
            if (!cr.attributes.verses) {
              addRes(verseSet, cr);
            } else {
              const verses = cr.attributes.verses
                .split(',')
                .map((v) => parseInt(v));
              for (let v = startVerse; v <= endVerse; v += 1) {
                if (verses.includes(v)) {
                  addRes(verseSet, cr);
                  break;
                }
              }
            }
          }
        }
      });
      return {
        books: Array.from(bookSet),
        chapters: Array.from(chapSet),
        verses: Array.from(verseSet),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookCd, findRef]
  );
  useEffect(() => {
    setRefLevel(planType(plan)?.scripture ? RefLevel.Verse : RefLevel.All);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    const res = getNotes();
    const filtered = res.filter(
      (r) =>
        (refLevel === RefLevel.Verse && refRes.verses.includes(r.id)) ||
        (refLevel === RefLevel.Chapter && refRes.chapters.includes(r.id)) ||
        (refLevel === RefLevel.Book && refRes.books.includes(r.id)) ||
        refLevel === RefLevel.All
    );
    setNotes(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refLevel, refRes]);

  useEffect(() => {
    setData(
      notes.map((r) => {
        const langArr = r.attributes.languagebcp47?.split('|');
        const language = langArr
          ? langArr.length > 1
            ? `${langArr[0]} (${langArr[1]})`
            : langArr[0]
          : r.attributes.languagebcp47;
        const catRec = findRecord(
          memory,
          'artifactcategory',
          related(r, 'artifactCategory')
        ) as ArtifactCategoryD;
        const catSlug = catRec?.attributes?.categoryname as string | undefined;
        const category = catSlug
          ? (localizedArtifactCategory(catSlug) as string) || catSlug
          : catSlug || '';
        return {
          language,
          category,
          title: r.attributes.title || '',
          description: r.attributes.description || '',
          keywords: r.attributes.keywords?.replace(/\|/g, ', '),
          terms: r.attributes.termsOfUse ? t.yes : t.no,
          source: noteSource(r),
          srid: r.id,
        } as IRRow;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const termsOfUse = (i: number): string | undefined => {
    return notes[i].attributes.termsOfUse;
  };

  return (
    <PassageDataTable
      isNote={true}
      data={data}
      bookOpt={bookOpt}
      onSelect={handleSelect}
      termsOfUse={termsOfUse}
      onOpen={onOpen}
      onBookCd={setBookCd}
      onFindRef={setFindRef}
      onRefLevel={setRefLevel}
      levelIn={refLevel}
      value={value}
    />
  );
};

export default SelectNote;
