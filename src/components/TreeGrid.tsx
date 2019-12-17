import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import {
  Column,
  TreeDataState,
  Sorting,
  SortingState,
  SelectionState,
  FilteringState,
  GroupingState,
  PagingState,
  CustomTreeData,
  TableColumnWidthInfo,
  IntegratedFiltering,
  IntegratedPaging,
  IntegratedSorting,
  IntegratedSelection,
  IntegratedGrouping,
  TableColumnVisibility,
} from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  TableHeaderRow,
  TableFilterRow,
  TableTreeColumn,
  PagingPanel,
  TableColumnResizing,
  Toolbar,
  GroupingPanel,
  TableGroupRow,
  DragDropProvider,
} from '@devexpress/dx-react-grid-material-ui';

interface IProps {
  rows: Array<any>;
  columns: Array<Column>;
  columnWidths: Array<TableColumnWidthInfo>;
  columnSorting?: Array<IntegratedSorting.ColumnExtension>;
  cellComponent?: any;
  sorting?: Array<Sorting>;
  pageSizes: Array<number>;
  tableColumnExtensions: Table.ColumnExtension[];
  defaultHiddenColumnNames?: Array<string>;
  groupingStateColumnExtensions: GroupingState.ColumnExtension[];
  dataCell?: any;
  noDataCell?: any;
  treeColumn: string;
  showfilters?: boolean;
  showgroups?: boolean;
  showSelection?: boolean;
  select?: (checks: Array<number>) => void;
  getChildRows: (row: any, rootRows: any[]) => any[] | null;
}

export default function TreeGrid(props: IProps) {
  const {
    columns,
    columnWidths,
    rows,
    getChildRows,
    pageSizes,
    tableColumnExtensions,
    defaultHiddenColumnNames,
    groupingStateColumnExtensions,
    cellComponent,
    sorting,
    treeColumn,
    showfilters,
    showgroups,
    showSelection,
    select,
    dataCell,
    noDataCell,
  } = props;
  const handleSelect = (checks: Array<string | number>) => {
    if (select) {
      select(checks.map(c => (typeof c === 'string' ? parseInt(c) : c)));
    }
  };
  const noRow = () => <></>;
  const noCols = () => <></>;
  //const totalSummaryItems = [{ columnName: 'passages', type: 'count' }];
  //const groupSummaryItems = [{ columnName: 'passages', type: 'count' }];
  return (
    <Paper>
      <Grid rows={rows} columns={columns}>
        <TreeDataState />
        <CustomTreeData getChildRows={getChildRows} />
        <FilteringState />
        <SortingState defaultSorting={sorting ? sorting : Array<Sorting>()} />
        {pageSizes.length > 0 && (
          <>
            <PagingState
              defaultCurrentPage={0}
              defaultPageSize={pageSizes[0]}
            />
          </>
        )}
        <SelectionState onSelectionChange={handleSelect} />
        <GroupingState columnExtensions={groupingStateColumnExtensions} />

        <IntegratedFiltering />
        <IntegratedSorting />
        {pageSizes.length > 0 && (
          <>
            <IntegratedPaging />
          </>
        )}
        <IntegratedSelection />
        <DragDropProvider />
        <IntegratedGrouping />

        {dataCell && noDataCell && !tableColumnExtensions ? (
          <Table cellComponent={dataCell} noDataCellComponent={noDataCell} />
        ) : dataCell && !noDataCell && !tableColumnExtensions ? (
          <Table cellComponent={dataCell} />
        ) : !dataCell && noDataCell && !tableColumnExtensions ? (
          <Table noDataCellComponent={noDataCell} />
        ) : dataCell && noDataCell && tableColumnExtensions ? (
          <Table
            cellComponent={dataCell}
            noDataCellComponent={noDataCell}
            columnExtensions={tableColumnExtensions}
          />
        ) : dataCell && !noDataCell && tableColumnExtensions ? (
          <Table
            cellComponent={dataCell}
            columnExtensions={tableColumnExtensions}
          />
        ) : !dataCell && noDataCell && tableColumnExtensions ? (
          <Table
            noDataCellComponent={noDataCell}
            columnExtensions={tableColumnExtensions}
          />
        ) : !dataCell && !noDataCell && tableColumnExtensions ? (
          <Table columnExtensions={tableColumnExtensions} />
        ) : (
          <Table />
        )}
        <TableColumnVisibility
          hiddenColumnNames={
            defaultHiddenColumnNames ? defaultHiddenColumnNames : []
          }
          emptyMessageComponent={noCols}
        />
        <TableColumnResizing defaultColumnWidths={columnWidths} />
        <TableHeaderRow showSortingControls />
        {showfilters !== null && !showfilters ? (
          <TableFilterRow showFilterSelector={true} rowComponent={noRow} />
        ) : (
          <TableFilterRow showFilterSelector={true} />
        )}
        {showSelection !== false && cellComponent ? (
          <TableTreeColumn
            for={treeColumn}
            showSelectionControls
            showSelectAll
            cellComponent={cellComponent}
          />
        ) : showSelection !== false && !cellComponent ? (
          <TableTreeColumn
            for={treeColumn}
            showSelectionControls
            showSelectAll
          />
        ) : showSelection === false && cellComponent ? (
          <TableTreeColumn for={treeColumn} cellComponent={cellComponent} />
        ) : (
          <TableTreeColumn for={treeColumn} />
        )}
        {pageSizes.length > 0 && (
          <>
            <PagingPanel pageSizes={pageSizes} />
          </>
        )}
        {showgroups !== null && showgroups ? <Toolbar /> : <></>}
        {showgroups !== null && showgroups ? <TableGroupRow /> : <></>}
        {showgroups !== null && showgroups ? (
          <GroupingPanel showGroupingControls />
        ) : (
          <></>
        )}
      </Grid>
    </Paper>
  );
}
