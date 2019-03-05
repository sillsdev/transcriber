import * as React from 'react';
// import './TaskTable.css';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState } from '../model/state';
import { ITask } from '../model/task';
import Paper from '@material-ui/core/Paper';
import Input from '@material-ui/core/Input';
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
  Table, TableColumnResizing, TableFilterRow, TableGroupRow,
  TableHeaderRow, TableSelection, Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import * as taskActions from '../action/taskAction';

type NumberFormatterProps = DataTypeProvider.ValueFormatterProps & WithStyles<typeof styles>;
type NumberEditorProps = DataTypeProvider.ValueEditorProps & WithStyles<typeof styles>;

interface IGridState {
  columns: Column[],
  rows: ITask[],
  pageSizes: number[],
  numberColumns: string[],
}

const availableFilterOperations: string[] = [
  'equal', 'notEqual',
  'greaterThan', 'greaterThanOrEqual',
  'lessThan', 'lessThanOrEqual',
];

const styles = ({ typography }: Theme) => createStyles({
  currency: {
    fontWeight: typography.fontWeightMedium,
  },
  numericInput: {
    width: '100%',
  },
});

const getInputValue = (value?: string) : string =>
  (value === undefined ? '' : value);

const NumberEditor = withStyles(styles)(
  ({ onValueChange, classes, value } : NumberEditorProps) => {
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

const NumberFormatter = withStyles(styles)(
  ({ value, classes } : NumberFormatterProps) =>
    <i className={classes.currency}>{value}</i>
);

const NumberTypeProvider: React.ComponentType<DataTypeProviderProps> =
  (props: DataTypeProviderProps) => (
    <DataTypeProvider
      formatterComponent={NumberFormatter}
      editorComponent={NumberEditor}
      availableFilterOperations={availableFilterOperations}
      {...props}
    />
);

interface IProps extends IStateProps, IDispatchProps {
}

export class TaskTable extends React.Component<IProps, IGridState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      columns: [
        { name: 'taskId', title: 'Task' },
        { name: 'name', title: 'Reference' },
        { name: 'passageSet', title: 'Set' },
        { name: 'book', title: 'Book' },
        { name: 'description', title: 'Passage Title' },
      ],
      numberColumns: ['taskId', 'passageSet'],
      pageSizes: [5, 10, 15],
      rows: Array<ITask>(),
    };
  }

  componentDidMount() {
    this.props.fetchTask();
  }

  public render(): React.ReactNode {
    const {
      rows, columns, pageSizes,
      numberColumns,
    } = this.state;

    if (this.state.rows.length === 0 && this.props.loaded) {
      this.setState({rows: this.props.task})
    }

    return (
      <Paper id='TaskTable'>
        <Grid
          rows={rows}
          columns={columns}
        >
          <FilteringState />
          <SortingState
            defaultSorting={[
              { columnName: 'taskId', direction: 'asc' },
            ]}
          />

          <SelectionState />

          <GroupingState
            defaultGrouping={[{ columnName: 'book' }]}
            defaultExpandedGroups={['EnviroCare Max']}
          />
          <PagingState />

          <IntegratedGrouping />
          <IntegratedFiltering />
          <IntegratedSorting />
          <IntegratedPaging />
          <IntegratedSelection />

          <NumberTypeProvider for={numberColumns} />

          <DragDropProvider />

          <Table />
          <TableSelection showSelectAll={true} />
          <TableColumnResizing minColumnWidth={50} 
            defaultColumnWidths={[
              {columnName: 'taskId', width:100},
              {columnName: 'name', width:200},
              {columnName: 'passageSet', width:100},
              {columnName: 'book', width:200},
              {columnName: 'description', width:200}
            ]}
          />

          <TableHeaderRow showSortingControls={true} />
          <TableFilterRow showFilterSelector={true} />
          <PagingPanel pageSizes={pageSizes} />

          <TableGroupRow />
          <Toolbar />
          <GroupingPanel showSortingControls={true} />
        </Grid>
      </Paper>
    );
  }
}

interface IStateProps {
  loaded: boolean;
  task: ITask[];
};

const mapStateToProps = (state: IState): IStateProps => ({
  loaded: state.task.loaded,
  task: state.task.task,
});

interface IDispatchProps {
  fetchTask: typeof taskActions.fetchTask;
};

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({
    fetchTask: taskActions.fetchTask,
  }, dispatch),
});

export default withStyles(styles, { withTheme: true })(connect(mapStateToProps, mapDispatchToProps)(TaskTable) as any) as any;
