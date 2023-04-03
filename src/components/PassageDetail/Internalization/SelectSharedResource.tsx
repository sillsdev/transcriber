import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  IPassageDetailArtifactsStrings,
  ISharedStrings,
  Resource,
} from '../../../model';
import ShapingTable from '../../ShapingTable';
import { useArtifactCategory } from '../../../crud';
import { Sorting } from '@devexpress/dx-react-grid';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { ActionRow, AltButton, PriButton } from '../../../control';
import { shallowEqual, useSelector } from 'react-redux';
import {
  passageDetailArtifactsSelector,
  sharedSelector,
} from '../../../selector';

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
  const ctx = useContext(PassageDetailContext);
  const { getSharedResources } = ctx.state;
  const [resources, setResources] = useState<Resource[]>([]);
  const [data, setData] = useState<IRRow[]>([]);
  const [checks, setChecks] = useState<number[]>([]);
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

  useEffect(() => {
    getSharedResources().then((res) => {
      const latest = res.filter(
        (r) =>
          r.attributes?.latest &&
          !sourcePassages.includes(r.attributes.passageId)
      );
      setResources(latest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcePassages]);

  const numSort = (i: number, j: number) => i - j;

  const handleCheck = (chks: Array<number>) => {
    const newChecks = chks.map((r) => r).sort(numSort);
    if (checks.join(',') !== newChecks.join(',')) setChecks(newChecks);
  };

  useEffect(() => {
    setData(
      resources.map((r, i) => {
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
        <PriButton
          id="res-selected"
          onClick={handleSelect}
          disabled={checks.length === 0 || selecting.current}
        >
          {t.link}
        </PriButton>
        <AltButton id="res-select-cancel" onClick={handleCancel}>
          {ts.cancel}
        </AltButton>
      </ActionRow>
    </div>
  );
};

export default SelectSharedResource;
