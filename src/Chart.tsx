import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IState } from './model/state'
import { IChartStrings } from './model/localizeModel';
import localStrings from './selector/localize';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import {
    Chart,
    ArgumentAxis,
    ValueAxis,
    BarSeries,
    SplineSeries,
    Legend,
} from '@devexpress/dx-react-chart-material-ui';
import { ValueScale, Animation } from '@devexpress/dx-react-chart';

const Point = (props: any) => {
    const { style, ...restProps } = props;
    return (
        <BarSeries.Point
            style={{ ...style, animationDuration: `${(restProps.index + 1) * 0.3}s` }}
            {...restProps}
        />
    );
};

export interface IProps extends IStateProps, WithStyles<typeof styles> { };

export function Status(props: IProps) {
    const { t } = props;
    const [data, setData] = useState([
        { month: 'Jan', tasks: 50, total: 987 },
        { month: 'Feb', tasks: 100, total: 3000 },
        { month: 'March', tasks: 30, total: 1100 },
        { month: 'April', tasks: 107, total: 7100 },
        { month: 'May', tasks: 95, total: 4300 },
        { month: 'June', tasks: 150, total: 7500 },
    ]);

    return (
        <Paper>
            <Chart
                data={data}
            >
                <ValueScale name="tasks" />
                <ValueScale name="total" />

                <ArgumentAxis />
                <ValueAxis scaleName="tasks" showGrid={false} showLine showTicks />
                <ValueAxis scaleName="total" position="right" showGrid={false} showLine showTicks />

                <BarSeries
                    name={t.tasksCompleted}
                    valueField="tasks"
                    argumentField="month"
                    scaleName="tasks"
                    pointComponent={Point}
                />

                <SplineSeries
                    name={t.totalTransactions}
                    valueField="total"
                    argumentField="month"
                    scaleName="total"
                />
                <Animation />
                <Legend />
            </Chart>
        </Paper>
    );
}

const styles = {};

interface IStateProps {
    t: IChartStrings;
  }
  const mapStateToProps = (state: IState): IStateProps => ({
    t: localStrings(state, {layout: "chart"})
  });
  
  export default withStyles(styles, { withTheme: true })(
        connect(mapStateToProps)(Status) as any
    ) as any;
  