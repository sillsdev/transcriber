import * as React from 'react';
import { IGridStrings, ITreeChartStrings } from '../model';
import { Paper, PaperProps, styled, Typography } from '@mui/material';
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
import { shallowEqual, useSelector } from 'react-redux';
import { localizeGrid } from '../utils';
import { gridSelector, treeChartSelector } from '../selector';

const PREFIX = 'tg';
const classes = {
  detailContainer: `${PREFIX}-detailContainer`,
  title: `${PREFIX}-title`,
  paper: `${PREFIX}-paper`,
  paper2: `${PREFIX}-paper2`,
};
const StyledDiv = styled('div')(({ theme }) => ({
  [`&.${classes.detailContainer}`]: {
    marginBottom: theme.spacing(3),
  },
  [`& .${classes.title}`]: {
    color: theme.palette.text.primary,
    fontSize: theme.typography.fontSize,
  },
  [`& .${classes.paper}`]: {
    paddingTop: theme.spacing(3.5),
  },
  [`& .${classes.paper2}`]: {
    paddingTop: theme.spacing(3.5),
    '& #bottom-axis-container': {
      visibility: 'hidden',
    },
  },
}));

const valueFormatter = ({ value }: any) => value;
const AxisLabel = ({ text, ...restProps }: any) => (
  <ValueAxis.Label {...restProps} text={valueFormatter({ value: text })} />
);

const LegendRoot = (props: Legend.RootProps) => (
  <Legend.Root
    {...props}
    sx={{ display: 'flex', margin: 'auto', flexDirection: 'row' }}
  />
);

const LegendLabel = (props: Legend.LabelProps) => (
  <Legend.Label {...props} sx={{ whiteSpace: 'nowrap' }} />
);

const barSeriesForTask = (planwork: any) => {
  var acc: any[] = [];
  var names: string[] = [];
  planwork.forEach((pw: {}) => {
    Object.keys(pw).forEach((item, index) => {
      if (item !== 'task' && !names.includes(item)) {
        names.push(item);
        acc.push(
          <BarSeries
            key={index.toString()}
            valueField={item}
            argumentField="task"
            name={item}
          />
        );
      }
    });
  });
  return acc;
};

const gridDetailContainerBase =
  (t: ITreeChartStrings, data1: any, data2: any) =>
  ({ row }: any) => {
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
      <StyledDiv className={classes.detailContainer}>
        <h5 className={classes.title}>
          {t.contributions} {row.plan}
        </h5>
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
        <h5 className={classes.title}>
          {t.status} {row.plan}
        </h5>
        <Paper className={classes.paper2}>
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
      </StyledDiv>
    );
  };

const gridDetailContainer = (t: ITreeChartStrings, data1: any, data2: any) =>
  gridDetailContainerBase(t, data1, data2);

const NoDataCell = ({ value, style, ...restProps }: any) => {
  const tg: IGridStrings = useSelector(gridSelector, shallowEqual);

  return (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <Typography variant="h6" align="center">
        {tg.noData}
      </Typography>
    </Table.Cell>
  );
};

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

const ChartPaper = styled(Paper)<PaperProps>(() => ({
  '& .MuiTableRow-head': {
    display: 'none',
  },
}));

interface IProps {
  rows: Array<IPlanRow>;
  data1: Array<IWork>;
  data2: Array<IWork>;
}

export const TreeChart = (props: IProps) => {
  const { rows, data1, data2 } = props;
  const [columns] = React.useState([{ name: 'plan', title: 'Plan' }]);
  const t: ITreeChartStrings = useSelector(treeChartSelector, shallowEqual);
  const tg: IGridStrings = useSelector(gridSelector, shallowEqual);
  const { localizeTableMessages } = localizeGrid(tg);

  return (
    <ChartPaper id="TreeChart">
      <Grid rows={rows} columns={columns}>
        {/* <RowDetailState defaultExpandedRowIds={[1]} /> */}
        <RowDetailState expandedRowIds={rows.map((v, i) => i)} />
        <Table
          noDataCellComponent={NoDataCell}
          messages={localizeTableMessages}
        />
        <TableHeaderRow />
        <TableRowDetail
          contentComponent={gridDetailContainer(t, data1, data2)}
        />
      </Grid>
    </ChartPaper>
  );
};
export default TreeChart;
