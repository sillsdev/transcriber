import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  IPassageDetailArtifactsStrings,
  ISharedStrings,
  Resource,
  SharedResourceReference,
} from '../../../model';
import ShapingTable from '../../ShapingTable';
import { related, remoteId, useArtifactCategory } from '../../../crud';
import { Sorting } from '@devexpress/dx-react-grid';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { ActionRow, AltButton, PriButton } from '../../../control';
import { shallowEqual, useSelector } from 'react-redux';
import {
  passageDetailArtifactsSelector,
  sharedSelector,
} from '../../../selector';
import { useGlobal } from 'reactn';
import { QueryBuilder } from '@orbit/data';
import BigDialog from '../../../hoc/BigDialog';
import { Typography } from '@mui/material';

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

  const passageRefs = useMemo(
    () => {
      const resultSet = new Set<number>();
      const addRes = (sr: SharedResourceReference) => {
        resultSet.add(
          parseInt(
            remoteId(
              'sharedresource',
              related(sr, 'sharedResource'),
              memory.keyMap
            )
          )
        );
      };
      const m = /(\d+):(\d+)(?:-(\d+))/.exec(passage.attributes.reference);
      if (m) {
        const refRecs = memory.cache.query((q: QueryBuilder) =>
          q.findRecords('sharedresourcereference')
        ) as SharedResourceReference[];
        const chapRefs = refRecs.filter(
          (r) =>
            r.attributes.book === passage.attributes.book &&
            r.attributes.chapter === parseInt(m[1])
        );
        const startVerse = parseInt(m[2]);
        const endVerse = parseInt(m[3]);
        for (const cr of chapRefs) {
          if (!cr.attributes.verses) {
            addRes(cr);
          } else {
            const verses = cr.attributes.verses
              .split(',')
              .map((v) => parseInt(v));
            for (let v = startVerse; v <= endVerse; v += 1) {
              if (verses.includes(v)) {
                addRes(cr);
                break;
              }
            }
          }
        }
      }
      return Array.from(resultSet);
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
          passageRefs.includes(r.attributes.resourceId)
      );
      setResources(latest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcePassages]);

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

  return (
    <div id="select-shared-resources">
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
