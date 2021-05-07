import React from 'react';
import { Input } from '@material-ui/core';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme,
} from '@material-ui/core/styles';
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
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider,
  Grid,
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
} from '@devexpress/dx-react-grid-material-ui';
import { IGridStrings, IState } from '../model';
import { useEffect } from 'reactn';
import { localizeGrid } from '../utils';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    paper: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
    }) as any,
    size: {
      display: 'flex',
      flexGrow: 1,
      justifyContent: 'flex-end',
      marginRight: theme.spacing(5),
      fontWeight: theme.typography.fontWeightMedium,
    },
    numericInput: {
      width: '100%',
    },
  });

type SizeFormatterProps = DataTypeProvider.ValueFormatterProps &
  WithStyles<typeof styles>;
type SizeEditorProps = DataTypeProvider.ValueEditorProps &
  WithStyles<typeof styles>;

const availableFilterOperations: string[] = [
  'equal',
  'notEqual',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
];

const getInputValue = (value?: string): string =>
  value === undefined ? '' : value;

const SizeEditor = withStyles(styles)(
  ({ onValueChange, classes, value }: SizeEditorProps) => {
    const handleChange = (event: any) => {
      const { value: targetValue } = event.target;
      if (targetValue.trim() === '') {
        onValueChange(undefined);
        return;
      }
      onValueChange(parseInt(targetValue, 10));
    };
    return (
      <Input
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
  }
);

const SizeFormatter = withStyles(
  styles
)(({ value, classes }: SizeFormatterProps) => (
  <i className={classes.size}>{value}</i>
));

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
interface IStateProps {
  tg: IGridStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  tg: localStrings(state, { layout: 'grid' }),
});
interface IProps extends IStateProps {
  columns: Array<Column>;
  columnWidths?: Array<TableColumnWidthInfo>;
  columnFormatting?: Table.ColumnExtension[];
  columnSorting?: Array<IntegratedSorting.ColumnExtension>;
  pageSizes?: Array<number>;
  sortingEnabled?: Array<SortingState.ColumnExtension>;
  filteringEnabled?: Array<FilteringState.ColumnExtension>;
  filterCell: any;
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
    tg,
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
export default (connect(mapStateToProps)(ShapingTable) as any) as any;
