import React, { CSSProperties } from 'react';
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
import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

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

function ShapingTable(props: IProps) {
  const {
    columns,
    columnWidths,
    columnFormatting,
    columnSorting /* special sort function for each column as needed */,
    sortingEnabled /* whether sorting is enabled for each column */,
    filteringEnabled /* whether filtering is enabled for each column */,
    hiddenColumnNames,
    dataCell,
    noDataCell,
    numCols,
    rows,
    sorting,
    checks,
    select,
    selectCell,
    filters,
  } = props;
  const [selected, setSelected] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (checks)
      setSelected(checks.map((c) => (typeof c === 'string' ? parseInt(c) : c)));
  }, [checks]);

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
    select && select(newSelected);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  const rowSort = (a: any, b: any) => {
    for (let s of sorting || []) {
      const c = colSpec.find((c) => c.name === s.columnName);
      if (c?.sort) {
        const res = c.sort(a[s.columnName], b[s.columnName]);
        if (res !== 0) return res;
      }
    }
    return 0;
  };

  const rowFilter = (r: any) => {
    for (let f of filters || []) {
      const c = colSpec.find((c) => c.name === f.columnName);
      if (c?.filterValue) {
        if (f.operation === 'contains') {
          if (!r[f.columnName].includes(c.filterValue)) return false;
        } else if (f.operation === 'startsWith') {
          if (!r[f.columnName].startsWith(c.filterValue)) return false;
        } else if (f.operation === 'endsWith') {
          if (!r[f.columnName].endsWith(c.filterValue)) return false;
        } else if (f.operation === 'equal') {
          if (r[f.columnName] !== c.filterValue) return false;
        } else if (f.operation === 'notEqual') {
          if (r[f.columnName] === c.filterValue) return false;
        } else if (f.operation === 'greaterThan') {
          if (r[f.columnName] <= c.filterValue) return false;
        } else if (f.operation === 'greaterThanOrEqual') {
          if (r[f.columnName] < c.filterValue) return false;
        } else if (f.operation === 'lessThan') {
          if (r[f.columnName] >= c.filterValue) return false;
        } else if (f.operation === 'lessThanOrEqual') {
          if (r[f.columnName] > c.filterValue) return false;
        }
      }
    }
    return true;
  };

  interface IColSpec {
    name: string;
    title: string;
    width: number;
    align: string;
    wordWrapEnabled: boolean;
    hidden: boolean;
    sort?: (a: any, b: any) => number;
    isFiltered: boolean;
    filterValue?: string;
    filterOperation?: string;
  }
  const colSpec = React.useMemo(() => {
    const colSpec: IColSpec[] = columns.map((c) => {
      const col = {
        name: c.name,
        title: c.title ?? c.name,
      } as IColSpec;
      if (columnWidths) {
        const cw = columnWidths.find((w) => w.columnName === c.name);
        if (cw) {
          col.width =
            typeof cw.width === 'number' ? cw.width : parseInt(cw.width);
        }
      }
      if (hiddenColumnNames) {
        const hc = hiddenColumnNames.find((h) => h === c.name);
        if (hc) {
          col.hidden = true;
        }
      }
      if (numCols) {
        const nc = numCols.find((n) => n === c.name);
        if (nc) {
          col.align = 'right';
        }
      }
      if (columnFormatting) {
        const cf = columnFormatting.find((f) => f.columnName === c.name);
        if (cf) {
          col.align = cf.align ?? 'left';
          col.wordWrapEnabled = cf.wordWrapEnabled ?? false;
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
          col.sort = cs.compare;
        }
      }
      if (sortingEnabled) {
        const se = sortingEnabled.find((s) => s.columnName === c.name);
        if (se?.sortingEnabled) {
          if (!col?.sort)
            col.sort = (a: any, b: any) => (a === b ? 0 : a > b ? 1 : -1);
        } else {
          col.sort = undefined;
        }
      }
      if (sorting) {
        const ss = sorting.find((s) => s.columnName === c.name);
        if (ss?.direction === 'asc') {
          col.sort = (a: any, b: any) => (a === b ? 0 : a > b ? 1 : -1);
        } else if (ss?.direction === 'desc') {
          col.sort = (a: any, b: any) => (a === b ? 0 : a > b ? -1 : 1);
        }
      }
      if (filteringEnabled) {
        const fe = filteringEnabled.find((f) => f.columnName === c.name);
        if (fe) {
          col.isFiltered = fe.filteringEnabled;
        }
      }
      return col;
    });
    return colSpec;
  }, [
    columns,
    columnWidths,
    hiddenColumnNames,
    numCols,
    columnFormatting,
    columnSorting,
    sortingEnabled,
    sorting,
    filteringEnabled,
  ]);

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    row: object[];
    column: IColSpec;
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label={'dense table'}>
        <TableHead>
          <TableRow>
            <>
              {select || selectCell ? <TableCell /> : <></>}
              {colSpec.map((c) =>
                !c.hidden ? (
                  <TableCell
                    key={c.name}
                    sx={{ minWidth: c.width }}
                    align={c.align as any}
                  >
                    {c.title}
                  </TableCell>
                ) : (
                  <></>
                )
              )}
            </>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows
            .filter(rowFilter)
            .sort(rowSort)
            .map((r, i) => {
              const isItemSelected = isSelected(i);
              const labelId = `row-checkbox-${i}`;

              return (
                <TableRow
                  key={`row-${i}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <>
                    {select && selectCell ? (
                      selectCell({ row: r } as ICell)
                    ) : select ? (
                      <TableCell>
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onClick={(event) => handleClick(event, i)}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                        />
                      </TableCell>
                    ) : (
                      <></>
                    )}
                    {colSpec.map((c, n) => {
                      const value = r[c.name];
                      const style = {
                        whiteSpace: c.wordWrapEnabled
                          ? 'break-spaces'
                          : 'nowrap',
                      } as CSSProperties;
                      const props = {
                        value,
                        row: r,
                        column: c,
                        style,
                        align: c.align,
                      };
                      return c.hidden ? (
                        <></>
                      ) : dataCell ? (
                        dataCell(props)
                      ) : !r[c.name] && noDataCell ? (
                        noDataCell(props)
                      ) : (
                        <TableCell sx={style} align={c.align as any}>
                          {value}
                        </TableCell>
                      );
                    })}
                  </>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
export default ShapingTable;
