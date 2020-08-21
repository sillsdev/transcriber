import * as React from 'react';
import { IState, ITreeChartStrings } from '../model';
import Paper from '@material-ui/core/Paper';
import { RowDetailState } from '@devexpress/dx-react-grid';
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
  TableHeaderRow,
  TableRowDetail,
} from '@devexpress/dx-react-grid-material-ui';
import {
  withStyles,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import localStrings from '../selector/localize';
import { connect } from 'react-redux';

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

// const CurrencyTypeProvider = (props: any) => (
//   <DataTypeProvider {...props} formatterComponent={valueFormatter} />
// );

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
  Object.keys(planwork[0]).reduce((acc, item, index) => {
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
  }, [] as any);

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

interface IStateProps {
  t: ITreeChartStrings;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'treeChart' }),
});

const NoDataCell = connect(mapStateToProps)(
  ({ value, style, t, ...restProps }: any) => {
    return (
      <Table.Cell {...restProps} style={{ ...style }} value>
        <Typography variant="h6" align="center">
          {t.noData}
        </Typography>
      </Table.Cell>
    );
  }
) as any;

export interface IPlanRow {
  plan: string;
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

const useStyles = makeStyles({
  root: {
    '& .MuiTableRow-head': {
      display: 'none',
    },
  },
});

interface IProps {
  rows: Array<IPlanRow>;
  data1: Array<IWork>;
  data2: Array<IWork>;
}

export const TreeChart = (props: IProps) => {
  const { rows, data1, data2 } = props;
  const classes = useStyles();
  const [columns] = React.useState([{ name: 'plan', title: 'Plan' }]);

  return (
    <Paper id="TreeChart" className={classes.root}>
      <Grid rows={rows} columns={columns}>
        {/* <RowDetailState defaultExpandedRowIds={[1]} /> */}
        <RowDetailState expandedRowIds={rows.map((v, i) => i)} />
        <Table noDataCellComponent={NoDataCell} />
        <TableHeaderRow />
        <TableRowDetail contentComponent={gridDetailContainer(data1, data2)} />
      </Grid>
    </Paper>
  );
};
export default TreeChart;
