import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  IPassageDetailArtifactsStrings,
  IState,
  Passage,
  PassageD,
  Resource,
  SharedResourceReference,
} from '../../../model';
import {
  findRecord,
  related,
  remoteIdNum,
  useAllSharedResourceRead,
  useArtifactCategory,
  usePlanType,
} from '../../../crud';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { shallowEqual, useSelector } from 'react-redux';
import { passageDetailArtifactsSelector } from '../../../selector';
import { useGlobal } from '../../../context/GlobalContext';
import { ResourceTypeEnum } from './PassageDetailArtifacts';
import { OptionType } from '../../BookSelect';
import { RecordKeyMap } from '@orbit/records';
import PassageDataTable, { IRRow, RefLevel } from '../../PassageDataTable';
import { passageTypeFromRef } from '../../../control/RefRender';
import { PassageTypeEnum } from '../../../model/passageType';

interface IProps {
  sourcePassages: number[];
  scope: ResourceTypeEnum;
  onScope?: (val: ResourceTypeEnum) => void;
  onOpen: (val: boolean) => void;
  onSelect?: (resources: Resource[]) => Promise<void>;
}

export const SelectSharedResource = (props: IProps) => {
  const { sourcePassages, scope, onScope, onOpen, onSelect } = props;
  const [refLevel, setRefLevel] = useState<RefLevel>(RefLevel.Verse);
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan'); //will be constant here
  const ctx = useContext(PassageDetailContext);
  const { passage, section } = ctx.state;
  const getAllSharedResources = useAllSharedResourceRead();
  const [resources, setResources] = useState<Resource[]>([]);
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

  const isFlat = useMemo(() => {
    return planType(plan)?.flat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const handleSelect = async (checks: number[]) => {
    if (!selecting.current) {
      selecting.current = true;
      onSelect &&
        onSelect(resources.filter((r, i) => checks.includes(i))).finally(() => {
          selecting.current = false;
          onOpen && onOpen(false);
        });
    }
  };

  useEffect(() => {
    setRefLevel(
      planType(related(section, 'plan'))?.scripture
        ? RefLevel.Verse
        : RefLevel.All
    );
    if (passage) {
      setBookCd(passage.attributes.book);
      setBookOpt(
        bookSuggestions.find((s) => s.value === passage.attributes.book)
      );
    }
    if (scope === ResourceTypeEnum.passageResource) {
      setFindRef(passage.attributes.reference);
    } else if (scope === ResourceTypeEnum.sectionResource) {
      const secRefs: string[] = [];
      const passages = related(section, 'passages') as PassageD[];
      passages?.forEach((recId) => {
        const passRec = findRecord(memory, 'passage', recId.id) as Passage;
        const passType = passageTypeFromRef(
          passRec.attributes.reference,
          isFlat
        );
        if (passType === PassageTypeEnum.PASSAGE)
          secRefs.push(passRec.attributes.reference);
      });
      setFindRef(secRefs.join('; '));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, section, scope]);

  const refRes = useMemo(
    () => {
      const bookSet = new Set<number>();
      const chapSet = new Set<number>();
      const verseSet = new Set<number>();
      const addRes = (set: Set<number>, sr: SharedResourceReference) => {
        set.add(
          remoteIdNum(
            'sharedresource',
            related(sr, 'sharedResource'),
            memory?.keyMap as RecordKeyMap
          )
        );
      };
      const refRecs = memory.cache.query((q) =>
        q.findRecords('sharedresourcereference')
      ) as SharedResourceReference[];
      const bookRefs = refRecs.filter((r) => r.attributes?.book === bookCd);
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
    getAllSharedResources().then((res) => {
      const latest = res.filter(
        (r) =>
          r.attributes?.latest &&
          !sourcePassages.includes(r.attributes.passageId) &&
          ((refLevel === RefLevel.Verse &&
            refRes.verses.includes(r.attributes.resourceId)) ||
            (refLevel === RefLevel.Chapter &&
              refRes.chapters.includes(r.attributes.resourceId)) ||
            (refLevel === RefLevel.Book &&
              refRes.books.includes(r.attributes.resourceId)) ||
            refLevel === RefLevel.All)
      );
      setResources(latest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcePassages, refLevel, refRes]);

  useEffect(() => {
    setData(
      resources.map((r) => {
        const langArr = r.attributes.languagebcp47?.split('|');
        const language = langArr
          ? langArr.length > 1
            ? `${langArr[0]} (${langArr[1]})`
            : langArr[0]
          : r.attributes.language;
        const catSlug = r.attributes.categoryName;
        const category = catSlug
          ? (localizedArtifactCategory(catSlug) as string) || catSlug
          : catSlug || '';
        return {
          language,
          category,
          title: r.attributes.title || r.attributes.originalFile,
          description: r.attributes.description || r.attributes.passageDesc,
          version: r.attributes.versionNumber,
          keywords: r.attributes.keywords?.replace('|', ', '),
          terms: r.attributes.termsOfUse ? t.yes : t.no,
          source: r.attributes.projectName,
        } as IRRow;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources]);

  const termsOfUse = (i: number): string | undefined => {
    return resources[i].attributes.termsOfUse;
  };

  return (
    <PassageDataTable
      data={data}
      bookOpt={bookOpt}
      onSelect={handleSelect}
      termsOfUse={termsOfUse}
      onOpen={onOpen}
      onBookCd={setBookCd}
      initFindRef={findRef}
      onFindRef={setFindRef}
      onRefLevel={setRefLevel}
      scope={scope}
      onScope={onScope}
    />
  );
};

export default SelectSharedResource;
