import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Plan, PlanType, Section, IPlanTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { Schema, QueryBuilder, TransformBuilder } from '@orbit/data';
import Store from '@orbit/store';
import { Paper, Input } from '@material-ui/core';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import {
  Column,
  FilteringState, GroupingState,
  IntegratedFiltering, IntegratedGrouping, IntegratedPaging, IntegratedSelection, IntegratedSorting,
  PagingState, SelectionState, SortingState, DataTypeProvider, DataTypeProviderProps,
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider,
  Grid, GroupingPanel, PagingPanel,
  Table, TableFilterRow, TableGroupRow,
  TableHeaderRow, TableColumnResizing, TableSelection, Toolbar,
} from '@devexpress/dx-react-grid-material-ui';

type CurrencyFormatterProps = DataTypeProvider.ValueFormatterProps & WithStyles<typeof styles>;
type CurrencyEditorProps = DataTypeProvider.ValueEditorProps & WithStyles<typeof styles>;

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
        currency: {
      fontWeight: theme.typography.fontWeightMedium,
    },
    numericInput: {
      width: '100%',
    },
  });
  
const availableFilterOperations: string[] = [
  'equal', 'notEqual',
  'greaterThan', 'greaterThanOrEqual',
  'lessThan', 'lessThanOrEqual',
];

const getInputValue = (value?: string) : string =>
  (value === undefined ? '' : value);

const getColor = (amount: number) : string => {
  if (amount < 1000) {
    return '#F44336';
  }
  if (amount < 5000) {
    return '#FFC107';
  }
  if (amount < 10000) {
    return '#009688';  
  }
  return '#FF5722';
};

const CurrencyEditor = withStyles(styles)(
  ({ onValueChange, classes, value } : CurrencyEditorProps) => {
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

const CurrencyFormatter = withStyles(styles)(
  ({ value, classes } : CurrencyFormatterProps) =>
    <i className={classes.currency} style={{ color: getColor(value) }}>{value}kb</i>
);

const CurrencyTypeProvider: React.ComponentType<DataTypeProviderProps> =
  (props: DataTypeProviderProps) => (
    <DataTypeProvider
      formatterComponent={CurrencyFormatter}
      editorComponent={CurrencyEditor}
      availableFilterOperations={availableFilterOperations}
      {...props}
    />
);

interface IStateProps {
    t: IPlanTableStrings;
  };
  
  interface IRecordProps {
    plans: Array<Plan>;
    planTypes: Array<PlanType>;
    sections: Array<Section>;
  }
  
  interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
    updateStore: any;
    displaySet: (type: string) => any;
  };
  
export function MediaTable(props: IProps) {
    const { classes, t } = props
    const [columns, setColumns] = useState([
        { name: 'fileName', title: 'File Name' },
        { name: 'sectionId', title: 'Section Id' },
        { name: 'sectionName', title: 'Section Name' },
        { name: 'book', title: 'Book' },
        { name: 'reference', title: 'Ref' },
        { name: 'duration', title: 'Duration' },
        { name: 'size', title: 'Size' },
        { name: 'version', title: 'Version' },
      ]);
    const [columnWidth] = useState([
        { columnName: "fileName", width: 200 },
        { columnName: "sectionId", width: 100 },
        { columnName: "sectionName", width: 150 },
        { columnName: "book", width: 100 },
        { columnName: "reference", width: 100 },
        { columnName: "duration", width: 100 },
        { columnName: "size", width: 100 },
        { columnName: "version", width: 100 },
      ]);
        const [currencyColumns, setCurrencyColumns] = useState(['size']);
    const [pageSizes, setPageSizes] = useState([5, 10, 15]);
    const [rows, setRows] = useState([
        {fileName: 'GEN-001-001025.mp3', sectionId: '1', sectionName: 'Creation Story', book: 'Genesis', reference: '1:1-25a', duration: '30 seconds', size: 250, version: '1' },
        {fileName: 'GEN-001-002631.mp3', sectionId: '', sectionName: '', book: '', reference: '', duration: '45 seconds', size: 445, version: '1' },
    ]);

    return (
        <div className={classes.root}>
        <div className={classes.container}>
        <div className={classes.paper}>
        <Grid
          rows={rows}
          columns={columns}
        >
          <FilteringState
            // defaultFilters={[{ columnName: 'sectionId', operation: 'equal', value: '' }]}
          />
          <SortingState
            defaultSorting={[
              { columnName: 'fileName', direction: 'asc' },
              { columnName: 'version', direction: 'asc' },
            ]}
          />

          <SelectionState />

          <GroupingState
            // defaultGrouping={[{ columnName: 'product' }]}
            // defaultExpandedGroups={['Piano']}
          />
          <PagingState />

          <IntegratedGrouping />
          <IntegratedFiltering />
          <IntegratedSorting />
          <IntegratedPaging />
          <IntegratedSelection />

          <CurrencyTypeProvider for={currencyColumns} />

          <DragDropProvider />

          <Table />
          <TableColumnResizing
                  minColumnWidth={50}
                  defaultColumnWidths={columnWidth}
                />
          <TableSelection showSelectAll={true} />

          <TableHeaderRow showSortingControls={true} />
          <TableFilterRow showFilterSelector={true} />
          <PagingPanel pageSizes={pageSizes} />

          <TableGroupRow />
          <Toolbar />
          <GroupingPanel showSortingControls={true} />
        </Grid>
      </div>
      </div>
      </div>
    );
};

const mapStateToProps = (state: IState): IStateProps => ({
    t: localStrings(state, {layout: "planTable"})
  });
  
  const mapRecordsToProps = {
    plans: (q: QueryBuilder) => q.findRecords('plan'),
    planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
    sections: (q: QueryBuilder) => q.findRecords('section'),
  }
  
  export default withStyles(styles, { withTheme: true })(
      withData(mapRecordsToProps)(
          connect(mapStateToProps)(MediaTable) as any
          ) as any
      ) as any;
  