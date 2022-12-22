import React, { PropsWithChildren } from 'react';
import { Input, styled } from '@mui/material';
import {
  Column,
  FilteringState,
  Filter,
  GroupingState,
  SummaryState,
  SummaryItem,
  IntegratedFiltering,
  IntegratedGrouping,
  IntegratedPaging,
  IntegratedSelection,
  IntegratedSorting,
  IntegratedSummary,
  TableColumnWidthInfo,
  PagingState,
  SelectionState,
  SortingState,
  Sorting,
  Grouping,
  DataTypeProvider,
  DataTypeProviderProps,
  TableColumnVisibility,
  GridColumnExtension,
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider,
  Grid as GridBar,
  GroupingPanel,
  PagingPanel,
  Table,
  TableFilterRow,
  TableGroupRow,
  TableHeaderRow,
  TableBandHeader,
  TableColumnResizing,
  TableSelection,
  TableSummaryRow,
  Toolbar,
  GridProps,
} from '@devexpress/dx-react-grid-material-ui';
import { IGridStrings } from '../model';
import { useEffect } from 'react';
import { localizeGrid } from '../utils';
import { shallowEqual, useSelector } from 'react-redux';
import { gridSelector } from '../selector';

type SizeFormatterProps = DataTypeProvider.ValueFormatterProps;
type SizeEditorProps = DataTypeProvider.ValueEditorProps;

const Grid = (props: GridProps & PropsWithChildren) => {
  return <GridBar {...props} />;
};

const availableFilterOperations: string[] = [
  'equal',
  'notEqual',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
];

const PREFIX = 'st';
const classes = {
  size: `${PREFIX}-size`,
  numericInput: `${PREFIX}-numericInput`,
};
const StyledInput = styled(Input)(({ theme }) => ({
  [`& .${classes.numericInput}`]: {
    width: '100%',
  },
}));
const StyledI = styled('i')(({ theme }) => ({
  [`& .${classes.size}`]: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'flex-end',
    marginRight: theme.spacing(5),
    fontWeight: theme.typography.fontWeightMedium,
  },
}));

const getInputValue = (value?: string): string =>
  value === undefined ? '' : value;

const SizeEditor = ({ onValueChange, value }: SizeEditorProps) => {
  const handleChange = (event: any) => {
    const { value: targetValue } = event.target;
    if (targetValue.trim() === '') {
      onValueChange(undefined);
      return;
    }
    onValueChange(parseInt(targetValue, 10));
  };
  return (
    <StyledInput
      type="number"
      classes={{
        input: classes.numericInput,
      }}
      fullWidth={true}
      value={getInputValue(value)}
      inputProps={{
        min: 0,
        placeholder: 'Filter...',
      }}
      onChange={handleChange}
    />
  );
};

const SizeFormatter = ({ value }: SizeFormatterProps) => (
  <StyledI>{value}</StyledI>
);

const SizeTypeProvider: React.ComponentType<DataTypeProviderProps> = (
  props: DataTypeProviderProps
) => (
  <DataTypeProvider
    formatterComponent={SizeFormatter}
    editorComponent={SizeEditor}
    availableFilterOperations={availableFilterOperations}
    {...props}
  />
);

interface IProps {
  columns: Array<Column>;
  columnWidths?: Array<TableColumnWidthInfo>;
  columnFormatting?: Array<GridColumnExtension>;
  columnSorting?: Array<IntegratedSorting.ColumnExtension>;
  pageSizes?: Array<number>;
  sortingEnabled?: Array<SortingState.ColumnExtension>;
  filteringEnabled?: Array<FilteringState.ColumnExtension>;
  filterCell?: any;
  filters?: Filter[];
  onFiltersChange?: (filters: Filter[]) => void; // this caused problems
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
    pageSizes,
    sortingEnabled /* whether sorting is enabled for each column */,
    filteringEnabled /* whether filtering is enabled for each column */,
    filterCell,
    filters /* start with these filters */,
    onFiltersChange /* when set, filter looses focus on typing */,
    hiddenColumnNames,
    defaultGrouping,
    expandedGroups,
    dataCell,
    noDataCell,
    numCols,
    rows,
    sorting,
    checks,
    select,
    selectCell,
    shaping,
    bandHeader,
    summaryItems,
  } = props;
  const tg: IGridStrings = useSelector(gridSelector, shallowEqual);
  const [myGroups, setMyGroups] = React.useState<string[]>();
  const [currentFilters, setCurrentFilters] = React.useState(filters || []);
  const {
    localizeFilter,
    localizeGroupingPanel,
    localizePaging,
    localizeRowSummary,
    localizeTableMessages,
  } = localizeGrid(tg);

  const handleExpGrp = (groups: string[]) => {
    setMyGroups(groups);
  };

  const handleSelect = (checks: Array<string | number>) => {
    if (select) {
      select(checks.map((c) => (typeof c === 'string' ? parseInt(c) : c)));
    }
  };
  const noRow = () => <></>;
  const noCols = () => <span>{tg.noColumns}</span>;

  useEffect(() => {
    setCurrentFilters(filters || []);
  }, [filters]);

  return (
    <Grid rows={rows} columns={columns}>
      {onFiltersChange /* when set filter looses focus on typing */ ? (
        <FilteringState
          columnExtensions={filteringEnabled || []}
          filters={filters || []}
          onFiltersChange={onFiltersChange}
        />
      ) : (
        <FilteringState
          columnExtensions={filteringEnabled || []}
          filters={currentFilters}
          onFiltersChange={setCurrentFilters}
        />
      )}

      <SortingState
        defaultSorting={sorting ? sorting : Array<Sorting>()}
        columnExtensions={sortingEnabled || []}
      />
      {pageSizes && pageSizes.length > 0 && <PagingState />}

      <SelectionState selection={checks} onSelectionChange={handleSelect} />

      <GroupingState
        columnGroupingEnabled={shaping !== null ? shaping : true}
        defaultGrouping={defaultGrouping}
        expandedGroups={!myGroups ? expandedGroups : myGroups}
        onExpandedGroupsChange={handleExpGrp}
      />
      {summaryItems && <SummaryState totalItems={summaryItems} />}

      {/* <PagingState /> */}

      <IntegratedGrouping />
      <IntegratedFiltering />
      <IntegratedSorting
        columnExtensions={columnSorting ? columnSorting : undefined}
      />
      {pageSizes && pageSizes.length > 0 && <IntegratedPaging />}
      <IntegratedSelection />
      {summaryItems && <IntegratedSummary />}

      <SizeTypeProvider for={numCols || []} />

      <DragDropProvider />

      {dataCell && noDataCell && !columnFormatting ? (
        <Table
          messages={localizeTableMessages}
          cellComponent={dataCell}
          noDataCellComponent={noDataCell}
        />
      ) : dataCell && !noDataCell && !columnFormatting ? (
        <Table messages={localizeTableMessages} cellComponent={dataCell} />
      ) : !dataCell && noDataCell && !columnFormatting ? (
        <Table
          messages={localizeTableMessages}
          noDataCellComponent={noDataCell}
        />
      ) : dataCell && noDataCell && columnFormatting ? (
        <Table
          messages={localizeTableMessages}
          cellComponent={dataCell}
          noDataCellComponent={noDataCell}
          columnExtensions={columnFormatting}
        />
      ) : dataCell && !noDataCell && columnFormatting ? (
        <Table
          messages={localizeTableMessages}
          cellComponent={dataCell}
          columnExtensions={columnFormatting}
        />
      ) : !dataCell && noDataCell && columnFormatting ? (
        <Table
          messages={localizeTableMessages}
          noDataCellComponent={noDataCell}
          columnExtensions={columnFormatting}
        />
      ) : !dataCell && !noDataCell && columnFormatting ? (
        <Table
          messages={localizeTableMessages}
          columnExtensions={columnFormatting}
        />
      ) : (
        <Table />
      )}
      <TableColumnVisibility
        hiddenColumnNames={hiddenColumnNames || []}
        emptyMessageComponent={noCols}
      />
      {columnWidths && (
        <TableColumnResizing
          minColumnWidth={50}
          defaultColumnWidths={columnWidths}
        />
      )}
      {select && !selectCell ? (
        <TableSelection showSelectAll={true} />
      ) : (
        select &&
        selectCell && (
          <TableSelection showSelectAll={false} cellComponent={selectCell} />
        )
      )}

      <TableHeaderRow showSortingControls={true} />

      {shaping !== null && !shaping ? (
        <TableFilterRow
          showFilterSelector={true}
          messages={localizeFilter}
          rowComponent={noRow}
        />
      ) : filterCell ? (
        <TableFilterRow
          showFilterSelector={true}
          messages={localizeFilter}
          cellComponent={filterCell}
        />
      ) : (
        <TableFilterRow showFilterSelector={true} messages={localizeFilter} />
      )}
      {pageSizes && pageSizes.length > 0 && (
        <PagingPanel pageSizes={pageSizes} messages={localizePaging} />
      )}

      <TableGroupRow />
      {summaryItems && <TableSummaryRow messages={localizeRowSummary} />}
      {bandHeader && <TableBandHeader columnBands={bandHeader} />}
      {(shaping !== null && !shaping) || expandedGroups ? (
        <Toolbar rootComponent={noRow} />
      ) : (
        <Toolbar />
      )}
      {shaping !== null && !shaping && !expandedGroups ? (
        <GroupingPanel
          showSortingControls={true}
          emptyMessageComponent={noRow}
          messages={localizeGroupingPanel}
        />
      ) : (
        !expandedGroups && <GroupingPanel showSortingControls={true} />
      )}
    </Grid>
  );
}
export default ShapingTable;
