import React, { useState } from 'react';
import { IMediaTabStrings } from '../../model';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import { FormControlLabel, Switch } from '@mui/material';
import ShapingTable from '../ShapingTable';
import { useOrganizedBy } from '../../crud';
import { IRow, IPRow } from '.';
import { Sorting } from '@devexpress/dx-react-grid';
import { useSelector } from 'react-redux';
import { mediaTabSelector } from '../../selector';

interface IProps {
  data: IPRow[];
  row: number;
  doAttach: (row: number, pRow: number) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  uploadMedia: string | undefined;
  setUploadMedia: (uploadMedia: string | undefined) => void;
  mediaRow: (id: string) => number;
}

export const PassageChooser = (props: IProps) => {
  const { data, row, visible, uploadMedia } = props;
  const t: IMediaTabStrings = useSelector(mediaTabSelector);
  const { doAttach, setVisible, setUploadMedia, mediaRow } = props;
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [pcheck, setCheck] = useState(-1);
  const columnDefs = [
    { name: 'sectionDesc', title: organizedBy },
    { name: 'reference', title: t.reference },
    { name: 'attached', title: t.associated },
    { name: 'sort', title: '\u00A0' },
  ];
  const columnWidths = [
    { columnName: 'sectionDesc', width: 150 },
    { columnName: 'reference', width: 150 },
  ];
  const columnFormatting = [
    { columnName: 'sectionDesc', aligh: 'left', wordWrapEnabled: true },
    { columnName: 'reference', aligh: 'left', wordWrapEnabled: true },
  ];
  const sorting: Sorting[] = [{ columnName: 'sort', direction: 'asc' }];
  const hiddenColumnNames = ['sort', 'attached'];
  const summaryItems = [{ columnName: 'reference', type: 'count' }];
  const [attachedFilter, setAttachedFilter] = useState({
    columnName: 'attached',
    operation: 'equal',
    value: 'N',
  });

  const handleAttachedFilterChange = (e: any) => {
    setAttachedFilter({
      columnName: 'attached',
      operation: 'equal',
      value: e.target.checked ? 'Y' : 'N',
    });
  };

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    mediaId?: string;
    selected?: boolean;
    onToggle?: () => void;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
    children?: Array<any>;
  }

  const Cell = (props: ICell) => {
    return <Table.Cell {...props} />;
  };

  const handleCheck = (checks: Array<number>) => {
    let mRow = row;
    if (uploadMedia) {
      mRow = mediaRow(uploadMedia);
      setUploadMedia(undefined);
    }
    if (visible && checks.length === 1 && mRow >= 0) {
      doAttach(mRow, checks[0]);
      setVisible(false);
      return;
    }
    setCheck(checks[0] === pcheck ? checks[1] : checks[0]);
  };

  return (
    <div>
      <FormControlLabel
        value="attached"
        labelPlacement="end"
        control={
          <Switch
            checked={attachedFilter.value === 'Y'}
            onChange={handleAttachedFilterChange}
          />
        }
        label={t.alreadyAssociated}
      />
      <ShapingTable
        columns={columnDefs}
        columnWidths={columnWidths}
        columnFormatting={columnFormatting}
        filters={[attachedFilter]}
        dataCell={Cell}
        sorting={sorting}
        rows={data}
        select={handleCheck}
        checks={pcheck >= 0 ? [pcheck] : []}
        shaping={true}
        hiddenColumnNames={hiddenColumnNames}
        expandedGroups={[]} // shuts off toolbar row
        summaryItems={summaryItems}
      />
    </div>
  );
};

export default PassageChooser;
