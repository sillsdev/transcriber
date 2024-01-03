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
  Radio,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

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

const style = (c: IColSpec) =>
  ({
    whiteSpace: c.wordWrapEnabled ? 'break-spaces' : 'nowrap',
  } as CSSProperties);

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
  type ColRef = number | string;
  const [selected, setSelected] = React.useState<ColRef[]>([]);

  React.useEffect(() => {
    if (checks)
      setSelected(checks.map((c) => (typeof c === 'string' ? parseInt(c) : c)));
  }, [checks]);

  const handleClick = (event: React.MouseEvent<unknown>, id: ColRef) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: ColRef[] = [];

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
    const selectRows = newSelected.map((s) =>
      rows.findIndex((r) => r.id === s)
    );
    select && select(selectRows);
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
      const curValue = r[f.columnName];
      const filterValue = f.value;
      const filterOp = f.operation;
      if (filterOp === 'contains') {
        if (!curValue.includes(filterValue)) return false;
      } else if (filterOp === 'startsWith') {
        if (!curValue.startsWith(filterValue)) return false;
      } else if (filterOp === 'endsWith') {
        if (!curValue.endsWith(filterValue)) return false;
      } else if (filterOp === 'equal') {
        if (curValue !== filterValue) return false;
      } else if (filterOp === 'notEqual') {
        if (curValue === filterValue) return false;
      } else if (filterOp === 'greaterThan') {
        if (curValue <= filterValue) return false;
      } else if (filterOp === 'greaterThanOrEqual') {
        if (curValue < filterValue) return false;
      } else if (filterOp === 'lessThan') {
        if (curValue >= filterValue) return false;
      } else if (filterOp === 'lessThanOrEqual') {
        if (curValue > filterValue) return false;
      }
    }
    return true;
  };

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
                    id={c.name}
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
              const isItemSelected = isSelected(r?.id ?? i);

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
                        <Radio
                          color="primary"
                          checked={isItemSelected}
                          onClick={(event) => handleClick(event, r?.id ?? i)}
                        />
                      </TableCell>
                    ) : (
                      <></>
                    )}
                    {colSpec.map((c, n) => {
                      const value = r[c.name];
                      const key = `cell-${r?.id ?? i}.${c?.name ?? n}`;
                      const props = {
                        value,
                        row: r,
                        column: c,
                        style: style(c),
                        align: c.align as any,
                        key,
                        id: key,
                      };
                      return c.hidden ? (
                        <></>
                      ) : dataCell ? (
                        dataCell(props)
                      ) : !r[c.name] && noDataCell ? (
                        noDataCell(props)
                      ) : (
                        <TableCell {...props}>{value}</TableCell>
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
