import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  IPassageDetailArtifactsStrings,
  ISharedStrings,
  Resource,
  SharedResourceReference,
} from '../../../model';
import ShapingTable from '../../ShapingTable';
import { related, remoteIdNum, useArtifactCategory } from '../../../crud';
import { Sorting } from '@devexpress/dx-react-grid';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import {
  ActionRow,
  AltButton,
  GrowingSpacer,
  PriButton,
} from '../../../control';
import { shallowEqual, useSelector } from 'react-redux';
import {
  passageDetailArtifactsSelector,
  sharedSelector,
} from '../../../selector';
import { useGlobal } from 'reactn';
import { QueryBuilder } from '@orbit/data';
import BigDialog from '../../../hoc/BigDialog';
import { Stack, Typography } from '@mui/material';
import RefLevelMenu from './RefLevelMenu';

export enum RefLevel {
  All,
  Book,
  Chapter,
  Verse,
}

interface IRRow {
  language: string;
  category: string;
  title: string;
  description: string;
  version: number;
  keywords: string;
  terms: string;
  source: string;
}

interface IProps {
  sourcePassages: number[];
  onOpen: (val: boolean) => void;
  onSelect?: (resources: Resource[]) => Promise<void>;
}

export const SelectSharedResource = (props: IProps) => {
  const { sourcePassages, onOpen, onSelect } = props;
  const [refLevel, setRefLevel] = useState<RefLevel>(RefLevel.Verse);
  const [memory] = useGlobal('memory');
  const ctx = useContext(PassageDetailContext);
  const { passage, getSharedResources } = ctx.state;
  const [resources, setResources] = useState<Resource[]>([]);
  const [data, setData] = useState<IRRow[]>([]);
  const [checks, setChecks] = useState<number[]>([]);
  const [termsCheck, setTermsCheck] = useState<number>();
  const selecting = useRef(false);
  const { localizedArtifactCategory } = useArtifactCategory();
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const columnDefs = [
    { name: 'language', title: t.language },
    { name: 'category', title: t.category },
    { name: 'title', title: t.title },
    { name: 'description', title: t.description },
    { name: 'version', title: t.version },
    { name: 'keywords', title: t.keywords },
    { name: 'terms', title: t.termsOfUse },
    { name: 'source', title: t.source },
  ];
  const columnWidths = [
    { columnName: 'language', width: 150 },
    { columnName: 'category', width: 150 },
    { columnName: 'title', width: 200 },
    { columnName: 'description', width: 200 },
    { columnName: 'version', width: 100 },
    { columnName: 'keywords', width: 200 },
    { columnName: 'terms', width: 100 },
    { columnName: 'source', width: 200 },
  ];
  const columnFormatting = [
    { columnName: 'title', wordWrapEnabled: true },
    { columnName: 'description', wordWrapEnabled: true },
    { columnName: 'keywords', wordWrapEnabled: true },
    { columnName: 'source', wordWrapEnabled: true },
  ];
  const sorting: Sorting[] = [
    { columnName: 'language', direction: 'asc' },
    { columnName: 'category', direction: 'asc' },
    { columnName: 'title', direction: 'asc' },
  ];

  const handleCancel = () => {
    onOpen && onOpen(false);
  };

  const handleSelect = async () => {
    if (!selecting.current) {
      selecting.current = true;
      onSelect &&
        onSelect(resources.filter((r, i) => checks.includes(i))).finally(() => {
          selecting.current = false;
          onOpen && onOpen(false);
        });
    }
  };

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
            memory.keyMap
          )
        );
      };
      const m = /(\d+):(\d+)(?:-(\d+))/.exec(passage.attributes.reference);
      if (m) {
        const refRecs = memory.cache.query((q: QueryBuilder) =>
          q.findRecords('sharedresourcereference')
        ) as SharedResourceReference[];
        const bookRefs = refRecs.filter(
          (r) => r.attributes.book === passage.attributes.book
        );
        bookRefs.forEach((b) => addRes(bookSet, b));
        const chapRefs = bookRefs.filter(
          (r) => r.attributes.chapter === parseInt(m[1])
        );
        chapRefs.forEach((c) => addRes(chapSet, c));
        const startVerse = parseInt(m[2]);
        const endVerse = parseInt(m[3]);
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
      return {
        books: Array.from(bookSet),
        chapters: Array.from(chapSet),
        verses: Array.from(verseSet),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passage]
  );

  useEffect(() => {
    getSharedResources().then((res) => {
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
  }, [sourcePassages, refLevel]);

  const numSort = (i: number, j: number) => i - j;

  const handleCheck = (chks: Array<number>) => {
    const newChecks = chks.map((r) => r).sort(numSort);
    if (checks.join(',') !== newChecks.join(',')) {
      let check = false;
      for (const c of chks) {
        if (!checks.includes(c) && resources[c].attributes.termsOfUse) {
          setTermsCheck(c);
          check = true;
          break;
        }
      }
      if (!check) setChecks(newChecks);
    }
  };

  const handleTermsCheck = () => {
    setTermsCheck(undefined);
  };

  const handleTermsAccept = () => {
    if (termsCheck !== undefined) setChecks(checks.concat([termsCheck]));
    setTermsCheck(undefined);
  };

  useEffect(() => {
    setData(
      resources.map((r) => {
        const langArr = r.attributes.languagebcp47.split('|');
        const language =
          langArr.length > 1 ? `${langArr[0]} (${langArr[1]})` : langArr[0];
        const catSlug = r.attributes.categoryName;
        const category = catSlug
          ? (localizedArtifactCategory(catSlug) as string) || catSlug
          : catSlug || '';
        return {
          language,
          category,
          title: r.attributes.title,
          description: r.attributes.description,
          version: r.attributes.versionNumber,
          keywords: r.attributes.keywords?.replace('|', ', '),
          terms: r.attributes.termsOfUse ? t.yes : t.no,
          source: r.attributes.projectName,
        } as IRRow;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, checks]);

  function handleRefLevel(what: string): void {
    if (what === 'verse') {
      setRefLevel(RefLevel.Verse);
    } else if (what === 'chapter') {
      setRefLevel(RefLevel.Chapter);
    } else if (what === 'book') {
      setRefLevel(RefLevel.Book);
    } else if (what === 'all') {
      setRefLevel(RefLevel.All);
    }
  }

  return (
    <div id="select-shared-resources">
      <Stack direction="row">
        <GrowingSpacer />
        <RefLevelMenu level={refLevel} action={handleRefLevel} />
      </Stack>
      <ShapingTable
        columns={columnDefs}
        columnWidths={columnWidths}
        columnFormatting={columnFormatting}
        sorting={sorting}
        rows={data}
        select={handleCheck}
        checks={checks}
        shaping={true}
        expandedGroups={[]} // shuts off toolbar row
      />
      <ActionRow>
        <AltButton id="res-select-cancel" onClick={handleCancel}>
          {ts.cancel}
        </AltButton>
        <PriButton
          id="res-selected"
          onClick={handleSelect}
          disabled={
            checks.length === 0 || selecting.current || Boolean(termsCheck)
          }
        >
          {t.link}
        </PriButton>
      </ActionRow>
      {termsCheck !== undefined && (
        <BigDialog
          title={t.termsReview}
          description={
            <Typography sx={{ pb: 2 }}>
              {'for {0}'.replace('{0}', resources[termsCheck].attributes.title)}
            </Typography>
          }
          isOpen={termsCheck !== undefined}
          onOpen={handleTermsCheck}
        >
          <>
            <Typography>
              {resources[termsCheck].attributes.termsOfUse}
            </Typography>
            <ActionRow>
              <AltButton id="terms-cancel" onClick={handleTermsCheck}>
                {ts.cancel}
              </AltButton>
              <PriButton id="terms-accept" onClick={handleTermsAccept}>
                {t.accept}
              </PriButton>
            </ActionRow>
          </>
        </BigDialog>
      )}
    </div>
  );
};

export default SelectSharedResource;
