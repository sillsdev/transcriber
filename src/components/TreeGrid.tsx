import * as React from 'react';
import {
  Checkbox,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Column,
  Sorting,
  GroupingState,
  TableColumnWidthInfo,
  GridColumnExtension,
  IntegratedSorting,
} from '@devexpress/dx-react-grid';
import { CSSProperties } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// interface ICell {
//   value: string;
//   style?: React.CSSProperties;
//   row: object[];
//   column: IColSpec;
// }

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
    // minWidth: c.width,
  } as CSSProperties);

interface IProps {
  rows: Array<any>;
  columns: Array<Column>;
  columnWidths: Array<TableColumnWidthInfo>;
  columnSorting?: Array<IntegratedSorting.ColumnExtension>;
  cellComponent?: any;
  sorting?: Array<Sorting>;
  pageSizes: Array<number>;
  tableColumnExtensions: Array<GridColumnExtension>;
  defaultHiddenColumnNames?: Array<string>;
  groupingStateColumnExtensions: GroupingState.ColumnExtension[];
  dataCell?: any;
  noDataCell?: any;
  treeColumn: string;
  showfilters?: boolean;
  showgroups?: boolean;
  showSelection?: boolean;
  select?: (checks: Array<number>) => void;
  checks: Array<string | number>;
  getChildRows: (row: any, rootRows: any[]) => any[] | null;
  canSelectRow?: (row: any) => boolean;
}

interface ISelectProps {
  canSelectRow?: (row: any) => boolean;
  isItemSelected: boolean;
  handleClick: (event: React.MouseEvent<unknown>, id?: number) => void;
  labelId?: string;
  rowIdx?: (r: any | undefined) => number;
  r?: any;
}

function SelectCell({
  canSelectRow,
  isItemSelected,
  handleClick,
  labelId,
  rowIdx,
  r,
}: ISelectProps) {
  return (
    <TableCell>
      {!canSelectRow || canSelectRow(r) ? (
        <Checkbox
          color="primary"
          checked={isItemSelected}
          onClick={(event) => handleClick(event, rowIdx?.(r))}
          inputProps={{
            'aria-labelledby': labelId,
          }}
        />
      ) : (
        <></>
      )}
    </TableCell>
  );
}

interface IRowProps {
  selected: number[];
  setSelected: (selected: number[]) => void;
  colSpec: IColSpec[];
  r: any;
  i: number;
}

function MyRow(props: IProps & IRowProps) {
  const {
    r,
    i,
    treeColumn,
    defaultHiddenColumnNames: hiddenColumnNames,
    cellComponent,
    select,
    dataCell,
    noDataCell,
    selected,
    setSelected,
    colSpec,
    getChildRows,
    canSelectRow,
  } = props;
  const [open, setOpen] = React.useState(false);

  const handleClick = (event: React.MouseEvent<unknown>, id?: number) => {
    const selectedIndex = selected.indexOf(id ?? -1);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id ?? -1);
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

  const rowIdx = (r: any) => props.rows.findIndex((pr) => pr === r);

  const isSelected = (r: any) => selected.indexOf(rowIdx(r)) !== -1;

  const isItemSelected = isSelected(r);

  const labelId = `row-checkbox-${i}`;
  const treeSpec = colSpec.find((c) => c.name === treeColumn);
  const subRows = getChildRows(r, props.rows);

  return (
    <>
      <TableRow
        key={`row-${r?.id ?? i}`}
        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      >
        <>
          {select ? (
            <SelectCell
              canSelectRow={canSelectRow}
              isItemSelected={isItemSelected}
              handleClick={handleClick}
              labelId={labelId}
              rowIdx={rowIdx}
              r={r}
            />
          ) : (
            <></>
          )}
          {treeColumn && (subRows?.length || 0) > 0 ? (
            <TableCell>
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => setOpen(!open)}
              >
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            </TableCell>
          ) : (
            <TableCell />
          )}
          {treeColumn && cellComponent ? (
            cellComponent({
              value: r[treeColumn],
              row: r,
              column: treeSpec,
              style: treeSpec ? style(treeSpec) : undefined,
              align: treeSpec?.align,
              children: [
                <TableCell align={(treeSpec?.align ?? 'left') as any}>
                  {r[treeColumn]}
                </TableCell>,
              ],
            })
          ) : treeColumn ? (
            <TableCell align={(treeSpec?.align ?? 'left') as any}>
              {r[treeColumn]}
            </TableCell>
          ) : (
            <></>
          )}
          {colSpec
            .filter(
              (c) =>
                c.name !== treeColumn && !hiddenColumnNames?.includes(c.name)
            )
            .map((c, n) => {
              const value = r[c.name];

              const props = {
                value,
                row: r,
                column: c,
                style: style(c),
                align: c.align as any,
                key: `cell-${i}.${n}`,
              };
              return c.name === treeColumn ? (
                <TableCell key={props.key} />
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
      {open &&
        subRows?.map((r, i2) => {
          const subProps = {
            ...props,
            r: r,
            i: i2,
            key: `sub-${r?.id ?? `${i}.${i2}`}`,
          };
          return <MyRow {...subProps} />;
        })}
    </>
  );
}

function TreeGrid(props: IProps) {
  const {
    columns,
    columnWidths,
    tableColumnExtensions: columnFormatting,
    defaultHiddenColumnNames: hiddenColumnNames,
    rows,
    treeColumn,
    sorting,
    select,
    checks,
  } = props;
  const [selected, setSelected] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (checks)
      setSelected(checks.map((c) => (typeof c === 'string' ? parseInt(c) : c)));
  }, [checks]);

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
      if (sorting) {
        const ss = sorting.find((s) => s.columnName === c.name);
        if (ss?.direction === 'asc') {
          col.sort = (a: any, b: any) => (a === b ? 0 : a > b ? 1 : -1);
        } else if (ss?.direction === 'desc') {
          col.sort = (a: any, b: any) => (a === b ? 0 : a > b ? -1 : 1);
        }
      }
      return col;
    });
    return colSpec;
  }, [columns, columnWidths, hiddenColumnNames, columnFormatting, sorting]);

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

  const sections = React.useMemo(() => rows.filter((r) => !r.parentId), [rows]);

  const handleSelectAll = (event: React.MouseEvent<unknown>) => {
    let newSelected: number[] = [];
    if (selected.length !== sections.length) {
      newSelected = rows
        .map((r, i) => ({ ...r, rIdx: i }))
        .filter((r) => !r.parentId)
        .map((r) => r.rIdx);
    }
    setSelected(newSelected);
    select && select(newSelected);
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label={'dense table'}>
        <TableHead>
          <TableRow>
            <>
              {select ? (
                <SelectCell
                  isItemSelected={selected.length === sections.length}
                  handleClick={handleSelectAll}
                  labelId={'select-all'}
                />
              ) : (
                <></>
              )}
              {treeColumn ? <TableCell /> : <></>}
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
            .filter((r) => !r.parentId)
            .sort(rowSort)
            .map((r, i) => (
              <MyRow
                key={`row-${r.id}`}
                r={r}
                i={i}
                selected={selected}
                setSelected={setSelected}
                colSpec={colSpec}
                {...props}
              />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
export default TreeGrid;
