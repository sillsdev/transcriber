import React from 'react';
import { Input } from '@material-ui/core';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
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
  DataTypeProviderProps
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
  Toolbar
} from '@devexpress/dx-react-grid-material-ui';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%'
    },
    container: {
      display: 'flex',
      justifyContent: 'center'
    },
    paper: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center'
    }),
    size: {
      display: 'flex',
      flexGrow: 1,
      justifyContent: 'flex-end',
      marginRight: theme.spacing(5),
      fontWeight: theme.typography.fontWeightMedium
    },
    numericInput: {
      width: '100%'
    }
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
  'lessThanOrEqual'
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
          input: classes.numericInput
        }}
        fullWidth={true}
        value={getInputValue(value)}
        inputProps={{
          min: 0,
          placeholder: 'Filter...'
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

interface IProps {
  columns: Array<Column>;
  columnWidths: Array<TableColumnWidthInfo>;
  columnSorting?: Array<IntegratedSorting.ColumnExtension>;
  numCols?: Array<string>;
  rows: Array<any>;
  sorting?: Array<Sorting>;
  shaping?: boolean;
  select?: (checks: Array<number>) => void;
}

export default function ShapingTable(props: IProps) {
  const {
    columns,
    columnWidths,
    columnSorting,
    numCols,
    rows,
    sorting,
    select,
    shaping
  } = props;

  const handleSelect = (checks: Array<string | number>) => {
    if (select) {
      select(checks.map(c => (typeof c === 'string' ? parseInt(c) : c)));
    }
  };
  const noRow = () => <></>;

  return (
    <Grid rows={rows} columns={columns}>
      <FilteringState
      // defaultFilters={[{ columnName: 'sectionId', operation: 'equal', value: '' }]}
      />
      <SortingState defaultSorting={sorting ? sorting : Array<Sorting>()} />

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

      <Table />
      <TableColumnResizing
        minColumnWidth={50}
        defaultColumnWidths={columnWidths}
      />
      <TableSelection showSelectAll={true} />

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
