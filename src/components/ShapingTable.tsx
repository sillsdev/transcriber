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
  GroupingState,
  IntegratedFiltering,
  IntegratedGrouping,
  // IntegratedPaging,
  IntegratedSelection,
  IntegratedSorting,
  TableColumnWidthInfo,
  // PagingState,
  SelectionState,
  SortingState,
  Sorting,
  DataTypeProvider,
  DataTypeProviderProps,
  TableColumnVisibility,
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider,
  Grid,
  GroupingPanel,
  // PagingPanel,
  Table,
  TableFilterRow,
  TableGroupRow,
  TableHeaderRow,
  TableColumnResizing,
  TableSelection,
  Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import { IState, IShapingTableStrings } from '../model';
import localStrings from '../selector/localize';
import { connect } from 'react-redux';

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
    }),
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

// const getColor = (amount: number) : string => {
//   if (amount < 1000) {
//     return '#F44336';
//   }
//   if (amount < 5000) {
//     return '#FFC107';
//   }
//   if (amount < 10000) {
//     return '#009688';
//   }
//   return '#FF5722';
// };

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

const SizeFormatter = withStyles(styles)(
  ({ value, classes }: SizeFormatterProps) => (
    // <i className={classes.size} style={{ color: getColor(value) }}>{value}</i>
    <i className={classes.size}>{value}</i>
  )
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
interface IStateProps {
  t: IShapingTableStrings;
}
interface IProps extends IStateProps {
  columns: Array<Column>;
  columnWidths?: Array<TableColumnWidthInfo>;
  columnFormatting?: Table.ColumnExtension[];
  columnSorting?: Array<IntegratedSorting.ColumnExtension>;
  sortingEnabled?: Array<SortingState.ColumnExtension>;
  filteringEnabled?: Array<FilteringState.ColumnExtension>;
  defaultHiddenColumnNames?: Array<string>;
  dataCell?: any;
  noDataCell?: any;
  numCols?: Array<string>;
  rows: Array<any>;
  sorting?: Array<Sorting>;
  shaping?: boolean;
  select?: (checks: Array<number>) => void;
}

export function ShapingTable(props: IProps) {
  const {
    t,
    columns,
    columnWidths,
    columnFormatting,
    columnSorting /* special sort function for each column as needed */,
    sortingEnabled /* whether sorting is enabled for each column */,
    filteringEnabled /* whether filtering is enabled for each column */,
    defaultHiddenColumnNames,
    dataCell,
    noDataCell,
    numCols,
    rows,
    sorting,
    select,
    shaping,
  } = props;

  const handleSelect = (checks: Array<string | number>) => {
    if (select) {
      select(checks.map(c => (typeof c === 'string' ? parseInt(c) : c)));
    }
  };
  const noRow = () => <></>;
  const noCols = () => <span>{t.NoColumns}</span>;
  return (
    <Grid rows={rows} columns={columns}>
      <FilteringState
        columnExtensions={filteringEnabled ? filteringEnabled : []}
        // defaultFilters={[{ columnName: 'sectionId', operation: 'equal', value: '' }]}
      />
      <SortingState
        defaultSorting={sorting ? sorting : Array<Sorting>()}
        columnExtensions={sortingEnabled ? sortingEnabled : []}
      />

      <SelectionState onSelectionChange={handleSelect} />

      <GroupingState
        columnGroupingEnabled={shaping !== null ? shaping : true}
        // defaultGrouping={[{ columnName: 'product' }]}
        // defaultExpandedGroups={['Piano']}
      />
      {/* <PagingState /> */}

      <IntegratedGrouping />
      <IntegratedFiltering />
      <IntegratedSorting
        columnExtensions={columnSorting ? columnSorting : undefined}
      />
      {/* <IntegratedPaging /> */}
      <IntegratedSelection />

      <SizeTypeProvider for={numCols ? numCols : Array<string>()} />

      <DragDropProvider />

      {dataCell && noDataCell && !columnFormatting ? (
        <Table cellComponent={dataCell} noDataCellComponent={noDataCell} />
      ) : dataCell && !noDataCell && !columnFormatting ? (
        <Table cellComponent={dataCell} />
      ) : !dataCell && noDataCell && !columnFormatting ? (
        <Table noDataCellComponent={noDataCell} />
      ) : dataCell && noDataCell && columnFormatting ? (
        <Table
          cellComponent={dataCell}
          noDataCellComponent={noDataCell}
          columnExtensions={columnFormatting}
        />
      ) : dataCell && !noDataCell && columnFormatting ? (
        <Table cellComponent={dataCell} columnExtensions={columnFormatting} />
      ) : !dataCell && noDataCell && columnFormatting ? (
        <Table
          noDataCellComponent={noDataCell}
          columnExtensions={columnFormatting}
        />
      ) : !dataCell && !noDataCell && columnFormatting ? (
        <Table columnExtensions={columnFormatting} />
      ) : (
        <Table />
      )}
      <TableColumnVisibility
        hiddenColumnNames={
          defaultHiddenColumnNames ? defaultHiddenColumnNames : []
        }
        emptyMessageComponent={noCols}
      />
      {columnWidths && (
        <TableColumnResizing
          minColumnWidth={50}
          defaultColumnWidths={columnWidths}
        />
      )}
      {!select || <TableSelection showSelectAll={true} />}

      <TableHeaderRow showSortingControls={true} />
      {shaping !== null && !shaping ? (
        <TableFilterRow showFilterSelector={true} rowComponent={noRow} />
      ) : (
        <TableFilterRow showFilterSelector={true} />
      )}
      {/* <PagingPanel pageSizes={pageSizes} /> */}

      <TableGroupRow />
      {shaping !== null && !shaping ? (
        <Toolbar rootComponent={noRow} />
      ) : (
        <Toolbar />
      )}
      {shaping !== null && !shaping ? (
        <GroupingPanel
          showSortingControls={true}
          emptyMessageComponent={noRow}
        />
      ) : (
        <GroupingPanel showSortingControls={true} />
      )}
    </Grid>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'shapingTable' }),
});

export default (connect(mapStateToProps)(ShapingTable) as any) as any;
