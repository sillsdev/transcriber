import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import { RowDetailState, DataTypeProvider } from '@devexpress/dx-react-grid';
import { scaleBand } from '@devexpress/dx-chart-core';
import { ArgumentScale, Stack } from '@devexpress/dx-react-chart';
import {
  Chart,
  BarSeries,
  ArgumentAxis,
  ValueAxis,
  Legend,
} from '@devexpress/dx-react-chart-material-ui';
import {
  Grid,
  Table,
  TableBandHeader,
  TableHeaderRow,
  TableRowDetail,
} from '@devexpress/dx-react-grid-material-ui';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
// import { personCount, statusCount, planCount } from './chart-data';

const detailContainerStyles = (theme: Theme) =>
  createStyles({
    detailContainer: {
      marginBottom: theme.spacing(3),
    },
    title: {
      color: theme.palette.text.primary,
      fontSize: theme.typography.fontSize,
    },
    paper: {
      paddingTop: theme.spacing(3.5),
    },
  });
const legendStyles = () =>
  createStyles({
    root: {
      display: 'flex',
      margin: 'auto',
      flexDirection: 'row',
    },
  });
const legendLabelStyles = () =>
  createStyles({
    label: {
      whiteSpace: 'nowrap',
    },
  });

// const valueFormatter = ({ value }: any) =>
//   `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const valueFormatter = ({ value }: any) => value;
const AxisLabel = ({ text, ...restProps }: any) => (
  <ValueAxis.Label {...restProps} text={valueFormatter({ value: text })} />
);

const CurrencyTypeProvider = (props: any) => (
  <DataTypeProvider {...props} formatterComponent={valueFormatter} />
);

const LegendRootBase = ({ classes, ...restProps }: any) => (
  <Legend.Root {...restProps} className={classes.root} />
);
const LegendRoot: any = withStyles(legendStyles, { name: 'LegendRoot' })(
  LegendRootBase
);

const LegendLabelBase = ({ classes, ...restProps }: any) => (
  <Legend.Label className={classes.label} {...restProps} />
);
const LegendLabel: any = withStyles(legendLabelStyles, { name: 'LegendLabel' })(
  LegendLabelBase
);

const barSeriesForTask = (planwork: any) =>
  Object.keys(planwork[0]).reduce(
    (acc, item, index) => {
      if (item !== 'task') {
        acc.push(
          <BarSeries
            key={index.toString()}
            valueField={item}
            argumentField="task"
            name={item}
          />
        );
      }
      return acc;
    },
    [] as any
  );

const gridDetailContainerBase = (data1: any, data2: any) => ({
  row,
  classes,
}: any) => {
  const planwork1 = data1.reduce((acc: any, item: any) => {
    const currentwork = item.work.reduce((current: any, itemTarget: any) => {
      let currentObj = {};
      if (itemTarget.plan === row.plan) {
        currentObj = { [itemTarget.name]: itemTarget.count };
      }
      return { ...current, ...currentObj };
    }, []);
    return [...acc, { task: item.task, ...currentwork }];
  }, []);

  const planwork2 = data2.reduce((acc: any, item: any) => {
    const currentwork = item.work.reduce((current: any, itemTarget: any) => {
      let currentObj = {};
      if (itemTarget.plan === row.plan) {
        currentObj = { [itemTarget.name]: itemTarget.count };
      }
      return { ...current, ...currentObj };
    }, []);
    return [...acc, { task: item.task, ...currentwork }];
  }, []);

  return (
    <div className={classes.detailContainer}>
      <h5 className={classes.title}>{`Contributions toward ${row.plan}`}</h5>
      <Paper className={classes.paper}>
        <Chart data={planwork1} height={300}>
          <ArgumentScale factory={scaleBand} />
          <ArgumentAxis showTicks={false} />
          <ValueAxis labelComponent={AxisLabel} />
          {barSeriesForTask(planwork1)}
          <Stack />
          <Legend
            rootComponent={LegendRoot}
            labelComponent={LegendLabel}
            position="bottom"
          />
        </Chart>
      </Paper>
      <h5 className={classes.title}>{`Status of ${row.plan}`}</h5>
      <Paper className={classes.paper}>
        <Chart data={planwork2} height={300}>
          <ArgumentScale factory={scaleBand} />
          <ArgumentAxis showTicks={false} />
          <ValueAxis labelComponent={AxisLabel} />
          {barSeriesForTask(planwork2)}
          <Stack />
          <Legend
            rootComponent={LegendRoot}
            labelComponent={LegendLabel}
            position="bottom"
          />
        </Chart>
      </Paper>
    </div>
  );
};
const gridDetailContainer: any = (data1: any, data2: any) =>
  withStyles(detailContainerStyles, { name: 'ChartContainer' })(
    gridDetailContainerBase(data1, data2)
  );

export interface IPlanRow {
  plan: string;
  review: number;
  transcribe: number;
}

export interface ITargetWork {
  name: string;
  plan: string;
  count: number;
}

export interface IWork {
  task: string;
  work: Array<ITargetWork>;
}

const initialState = {
  columns: [
    { name: 'plan', title: 'Plan' },
    { name: 'review', title: 'Review' },
    { name: 'transcribe', title: 'Transcribe' },
  ],
  columnBands: [
    {
      title: 'Task',
      children: [{ columnName: 'review' }, { columnName: 'transcribe' }],
    },
  ],
  formatCols: ['review', 'transcribe'],
};

interface IProps {
  rows: Array<IPlanRow>;
  data1: Array<IWork>;
  data2: Array<IWork>;
}

export default class TreeChart extends React.PureComponent<
  IProps,
  typeof initialState
> {
  public state = { ...initialState };

  constructor(props: IProps) {
    super(props);

    this.state = initialState;
  }

  render() {
    const { columns, columnBands, formatCols } = this.state;
    const { rows, data1, data2 } = this.props;

    return (
      <Paper>
        <Grid rows={rows} columns={columns}>
          <CurrencyTypeProvider for={formatCols} />
          {/* <RowDetailState defaultExpandedRowIds={[1]} /> */}
          <RowDetailState defaultExpandedRowIds={[]} />
          <Table />
          <TableHeaderRow />
          <TableRowDetail
            contentComponent={gridDetailContainer(data1, data2)}
          />
          <TableBandHeader columnBands={columnBands} />
        </Grid>
      </Paper>
    );
  }
}
