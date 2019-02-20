import * as React from 'react';
import './SchemeTable.css';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState } from '../model/state';
import { IScheme } from '../model/scheme';
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
import * as schemeActions from '../action/schemeAction';

type NumberFormatterProps = DataTypeProvider.ValueFormatterProps & WithStyles<typeof styles>;
type NumberEditorProps = DataTypeProvider.ValueEditorProps & WithStyles<typeof styles>;

interface IGridState {
  columns: Column[],
  rows: IScheme[],
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

export class SchemeTable extends React.Component<IProps, IGridState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      columns: [
        { name: 'set', title: 'Set' },
        { name: 'passage', title: 'Passage' },
        { name: 'chapter', title: 'Chapter' },
        { name: 'startVerse', title: 'Starting Verse' },
        { name: 'endVerse', title: 'Ending Verse' },
        { name: 'description', title: 'Description' },
      ],
      numberColumns: ['set', 'passage', 'chapter', 'startVerse', 'endVerse'],
      pageSizes: [5, 10, 15],
      rows: Array<IScheme>(),
    };
  }

  componentDidMount() {
    this.props.fetchScheme();
  }

  public render(): React.ReactNode {
    const {
      rows, columns, pageSizes,
      numberColumns,
    } = this.state;

    if (this.state.rows.length === 0 && this.props.loaded) {
      this.setState({rows: this.props.scheme})
    }

    return (
      <Paper id='SchemeTable'>
        <Grid
          rows={rows}
          columns={columns}
        >
          <FilteringState />
          <SortingState
            defaultSorting={[
              { columnName: 'set', direction: 'asc' },
              { columnName: 'passage', direction: 'asc' },
              { columnName: 'startVerse', direction: 'asc' },
            ]}
          />

          <SelectionState />

          <GroupingState
            defaultGrouping={[{ columnName: 'set' }]}
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
              {columnName: 'set', width:100},
              {columnName: 'passage', width:100},
              {columnName: 'chapter', width:100},
              {columnName: 'startVerse', width:100},
              {columnName: 'endVerse', width:100},
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
  scheme: IScheme[];
};

const mapStateToProps = (state: IState): IStateProps => ({
  loaded: state.scheme.loaded,
  scheme: state.scheme.scheme,
});

interface IDispatchProps {
  fetchScheme: typeof schemeActions.fetchScheme;
};

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({
    fetchScheme: schemeActions.fetchScheme,
  }, dispatch),
});

export default withStyles(styles, { withTheme: true })(connect(mapStateToProps, mapDispatchToProps)(SchemeTable) as any) as any;
