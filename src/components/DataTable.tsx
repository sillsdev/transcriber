import React from 'react';
import {
  Column,
  FilteringState,
  Filter,
  SummaryItem,
  IntegratedSorting,
  TableColumnWidthInfo,
  SortingState,
  Sorting,
  Grouping,
  GridColumnExtension,
} from '@devexpress/dx-react-grid';
import { TableBandHeader } from '@devexpress/dx-react-grid-material-ui';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface IProps {
  columns: Array<Column>;
  columnWidths?: Array<TableColumnWidthInfo>;
  columnFormatting?: Array<GridColumnExtension>;
  columnSorting?: Array<IntegratedSorting.ColumnExtension>;
  pageSizes?: Array<number>;
  sortingEnabled?: Array<SortingState.ColumnExtension>;
  filteringEnabled?: Array<FilteringState.ColumnExtension>;
  filters?: Filter[];
  hiddenColumnNames?: Array<string>;
  defaultGrouping?: Grouping[];
  expandedGroups?: string[];
  dataCell?: any;
  noDataCell?: any;
  numCols?: Array<string>;
  rows: Array<any>;
  sorting?: Array<Sorting>;
  shaping?: boolean;
  checks?: Array<number | string>;
  select?: (checks: Array<number>) => void;
  selectCell?: any;
  bandHeader?: TableBandHeader.ColumnBands[];
  summaryItems?: SummaryItem[];
}

function DataTable(props: IProps) {
  const {
    columns,
    columnWidths,
    columnFormatting,
    columnSorting /* special sortComparator function for each column as needed */,
    sortingEnabled /* whether sorting is enabled for each column */,
    filteringEnabled /* whether filtering is enabled for each column */,
    numCols,
    rows,
    checks,
    select,
    sorting,
  } = props;
  const [selected, setSelected] = React.useState<(string | number)[]>([]);

  React.useEffect(() => {
    if (checks)
      setSelected(checks.map((c) => (typeof c === 'string' ? parseInt(c) : c)));
  }, [checks]);

  const handleSelection = (selection: (number | string)[]) => {
    setSelected(selection);
    const numSelection =
      selection.length === 0
        ? []
        : selection.map((s) =>
            typeof s === 'string' ? rows.findIndex((r) => r.id === s) : s
          );
    select && select(numSelection);
  };

  // const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // const rowSort = (a: any, b: any) => {
  //   for (let s of sorting || []) {
  //     const c = colSpec.find((c) => c.name === s.columnName);
  //     if (c?.sortComparator) {
  //       const res = c.sortComparator(a[s.columnName], b[s.columnName]);
  //       if (res !== 0) return res;
  //     }
  //   }
  //   return 0;
  // };

  // const rowFilter = (r: any) => {
  //   for (let f of filters || []) {
  //     const c = colSpec.find((c) => c.name === f.columnName);
  //     if (c?.filterValue) {
  //       if (f.operation === 'contains') {
  //         if (!r[f.columnName].includes(c.filterValue)) return false;
  //       } else if (f.operation === 'startsWith') {
  //         if (!r[f.columnName].startsWith(c.filterValue)) return false;
  //       } else if (f.operation === 'endsWith') {
  //         if (!r[f.columnName].endsWith(c.filterValue)) return false;
  //       } else if (f.operation === 'equal') {
  //         if (r[f.columnName] !== c.filterValue) return false;
  //       } else if (f.operation === 'notEqual') {
  //         if (r[f.columnName] === c.filterValue) return false;
  //       } else if (f.operation === 'greaterThan') {
  //         if (r[f.columnName] <= c.filterValue) return false;
  //       } else if (f.operation === 'greaterThanOrEqual') {
  //         if (r[f.columnName] < c.filterValue) return false;
  //       } else if (f.operation === 'lessThan') {
  //         if (r[f.columnName] >= c.filterValue) return false;
  //       } else if (f.operation === 'lessThanOrEqual') {
  //         if (r[f.columnName] > c.filterValue) return false;
  //       }
  //     }
  //   }
  //   return true;
  // };

  const colSpec = React.useMemo(() => {
    const colSpec: GridColDef[] = columns.map((c) => {
      const col = {
        field: c.name,
        headerName: c.title ?? c.name,
      } as GridColDef;
      if (columnWidths) {
        const cw = columnWidths.find((w) => w.columnName === c.name);
        if (cw) {
          col.width =
            typeof cw.width === 'number' ? cw.width : parseInt(cw.width);
        }
      }
      // if (hiddenColumnNames) {
      //   const hc = hiddenColumnNames.find((h) => h === c.name);
      //   if (hc) {
      //     col.hidden = true;
      //   }
      // }
      if (numCols) {
        const nc = numCols.find((n) => n === c.name);
        if (nc) {
          col.align = 'right';
          col.type = 'number';
        }
      }
      if (columnFormatting) {
        const cf = columnFormatting.find((f) => f.columnName === c.name);
        if (cf) {
          col.align = cf.align ?? 'left';
          // col.wordWrapEnabled = cf.wordWrapEnabled ?? false;
          if (!col.width)
            col.width =
              typeof cf.width === 'string'
                ? parseInt(cf.width)
                : cf?.width ?? 100;
        }
      }
      if (columnSorting) {
        const cs = columnSorting.find((s) => s.columnName === c.name);
        if (cs?.compare) {
          col.sortComparator = cs.compare;
        }
      }
      if (sortingEnabled) {
        const se = sortingEnabled.find((s) => s.columnName === c.name);
        if (se?.sortingEnabled) {
          if (!col?.sortComparator)
            col.sortComparator = (a: any, b: any) =>
              a === b ? 0 : a > b ? 1 : -1;
        } else {
          col.sortComparator = undefined;
        }
      }
      if (sorting) {
        const ss = sorting.find((s) => s.columnName === c.name);
        if (ss?.direction === 'asc') {
          col.sortComparator = (a: any, b: any) =>
            a === b ? 0 : a > b ? 1 : -1;
        } else if (ss?.direction === 'desc') {
          col.sortComparator = (a: any, b: any) =>
            a === b ? 0 : a > b ? -1 : 1;
        }
      }
      if (filteringEnabled) {
        const fe = filteringEnabled.find((f) => f.columnName === c.name);
        if (fe) {
          col.filterable = fe.filteringEnabled;
        }
      }
      return col;
    });
    return colSpec;
  }, [
    columns,
    columnWidths,
    columnFormatting,
    columnSorting,
    sortingEnabled,
    sorting,
    filteringEnabled,
    numCols,
  ]);

  let myRows =
    rows.length > 0 && !rows[0]?.id
      ? rows.map((r, i) => ({ ...r, id: i }))
      : rows;

  return (
    <DataGrid
      rows={myRows}
      columns={colSpec}
      checkboxSelection
      rowSelectionModel={selected}
      onRowSelectionModelChange={handleSelection}
    />
  );
}
export default DataTable;
