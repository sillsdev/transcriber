import React, { useState } from 'react';
import { Input } from '@material-ui/core';
import {
  createStyles, withStyles, WithStyles, Theme
} from '@material-ui/core/styles';
import {
  Column, FilteringState, GroupingState,
  IntegratedFiltering, IntegratedGrouping,
  // IntegratedPaging,
  IntegratedSelection, IntegratedSorting, TableColumnWidthInfo,
  // PagingState,
  SelectionState, SortingState, Sorting, DataTypeProvider, DataTypeProviderProps,
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider, Grid, GroupingPanel,
  // PagingPanel,
  Table, TableFilterRow, TableGroupRow,
  TableHeaderRow, TableColumnResizing, TableSelection, Toolbar,
} from '@devexpress/dx-react-grid-material-ui';

const styles = (theme: Theme) => createStyles({
  root: {
      width: '100%',
  },
  container: {
    display: 'flex',
    justifyContent: 'center'
  },
  paper: theme.mixins.gutters({
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
  }),
  size: {
    fontWeight: theme.typography.fontWeightMedium,
  },
  numericInput: {
    width: '100%',
  },
});

type SizeFormatterProps = DataTypeProvider.ValueFormatterProps & WithStyles<typeof styles>;
type SizeEditorProps = DataTypeProvider.ValueEditorProps & WithStyles<typeof styles>;

const availableFilterOperations: string[] = [
  'equal', 'notEqual',
  'greaterThan', 'greaterThanOrEqual',
  'lessThan', 'lessThanOrEqual',
];

const getInputValue = (value?: string) : string =>
  (value === undefined ? '' : value);

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
  ({ onValueChange, classes, value } : SizeEditorProps) => {
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
  ({ value, classes } : SizeFormatterProps) =>
    // <i className={classes.size} style={{ color: getColor(value) }}>{value}kb</i>
    <i className={classes.size}>{value}kb</i>
);

const SizeTypeProvider: React.ComponentType<DataTypeProviderProps> =
  (props: DataTypeProviderProps) => (
    <DataTypeProvider
      formatterComponent={SizeFormatter}
      editorComponent={SizeEditor}
      availableFilterOperations={availableFilterOperations}
      {...props}
    />
);

interface IProps {
  columnDefs: Array<Column>;
  columnWidths: Array<TableColumnWidthInfo>;
  sizeCols?: Array<string>;
  rowData: Array<any>;
  select?: (checks: Array<number>) => void
};
  
export default function ShapingTable(props: IProps) {
    const { columnDefs, columnWidths, sizeCols, rowData, select } = props
    const [columns] = useState(columnDefs)
      // [
      //   { name: 'fileName', title: 'File Name' },
      //   { name: 'sectionId', title: 'Section Id' },
      //   { name: 'sectionName', title: 'Section Name' },
      //   { name: 'book', title: 'Book' },
      //   { name: 'reference', title: 'Ref' },
      //   { name: 'duration', title: 'Duration' },
      //   { name: 'size', title: 'Size' },
      //   { name: 'version', title: 'Version' },
      // ]);
    const [columnWidth] = useState(columnWidths);
      // [
      //   { columnName: "fileName", width: 200 },
      //   { columnName: "sectionId", width: 100 },
      //   { columnName: "sectionName", width: 150 },
      //   { columnName: "book", width: 100 },
      //   { columnName: "reference", width: 100 },
      //   { columnName: "duration", width: 100 },
      //   { columnName: "size", width: 100 },
      //   { columnName: "version", width: 100 },
      // ]);
    const [sizeColumns] = useState(sizeCols? sizeCols: Array<string>());
          // ['size']);
    // const [pageSizes, setPageSizes] = useState([5, 10, 15]);
    const [rows] = useState(rowData);
      // [
      //   {fileName: 'GEN-001-001025.mp3', sectionId: '1', sectionName: 'Creation Story', book: 'Genesis', reference: '1:1-25a', duration: '30 seconds', size: 250, version: '1' },
      //   {fileName: 'GEN-001-002631.mp3', sectionId: '', sectionName: '', book: '', reference: '', duration: '45 seconds', size: 445, version: '1' },
      // ]);
    const [sorting] = useState(Array<Sorting>());

    const handleSelect = (checks: Array<string|number>) => {
      if (select) {
        select(checks.map(c => typeof c === 'string'? parseInt(c): c))
      }
    }

    return (
        <Grid
          rows={rows}
          columns={columns}
        >
          <FilteringState
            // defaultFilters={[{ columnName: 'sectionId', operation: 'equal', value: '' }]}
          />
          <SortingState
            defaultSorting={sorting}
          />

          <SelectionState onSelectionChange={handleSelect} />

          <GroupingState
            // defaultGrouping={[{ columnName: 'product' }]}
            // defaultExpandedGroups={['Piano']}
          />
          {/* <PagingState /> */}

          <IntegratedGrouping />
          <IntegratedFiltering />
          <IntegratedSorting />
          {/* <IntegratedPaging /> */}
          <IntegratedSelection />

          <SizeTypeProvider for={sizeColumns} />

          <DragDropProvider />

          <Table />
          <TableColumnResizing
                  minColumnWidth={50}
                  defaultColumnWidths={columnWidth}
                />
          <TableSelection showSelectAll={true} />

          <TableHeaderRow showSortingControls={true} />
          <TableFilterRow showFilterSelector={true} />
          {/* <PagingPanel pageSizes={pageSizes} /> */}

          <TableGroupRow />
          <Toolbar />
          <GroupingPanel showSortingControls={true} />
        </Grid>
    );
};

  