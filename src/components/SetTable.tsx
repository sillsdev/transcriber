import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import ProjectType from '../model/projectType';
import { connect } from 'react-redux';
import { IState, Project, IProjectSettingsStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import DataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import './SetTable.css';

const styles = (theme: Theme) => ({
  container: {
      display: 'flex',
      margin: theme.spacing.unit * 4,
  },
  paper: {
      paddingLeft: theme.spacing.unit * 4,
  },
});

interface IStateProps {
  t: IProjectSettingsStrings;
};

interface IRecordProps {
  projects: Array<Project>;
  projectTypes: Array<ProjectType>;
};

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
  updateStore?: any
};
  
export function SetTable(props: IProps) {
    const { classes, t } = props;
    const [data, setData] = useState([
      [
        {value: 'Sequence',  readOnly: true, width: 120},
        {value: 'Title', readOnly: true, width: 180},
        {value: 'Reference', readOnly: true, width: 120},
        {value: 'Assignments', readOnly: true, width: 120},
        {value: 'Media', readOnly: true, width: 180},
      ],
      [{readOnly: true, value: 1}, {value: 'Creation Story'}, {value: '1:1-2:4'}, {value: (<Avatar />)}, {value: 'gen001001.mp3'}],
      [{readOnly: true, value: 2}, {value: 'Eden'}, {value: '2:5-25'}, {value: (<Avatar />)}, {value: 'gen002005.mpe'}],
      [{readOnly: true, value: 3}, {value: "First Sin"}, {value: '3:1-19'}, {value: (<Avatar />)}, {value: 'gen003001.mp3'}],
      [{readOnly: true, value: 4}, {value: "Paradise Lost"}, {value: '3:20-24'}, {value: (<Avatar />)}, {value: 'gen003020.mp3'}]
    ])

    return (
      <div className={classes.container}>
        <div className={classes.paper}>
          <DataSheet
            data={data as any}
            valueRenderer={(cell: any) => cell.value}
            onContextMenu={(e, cell, i, j) => cell.readOnly ? e.preventDefault() : null}
            onCellsChanged={changes => {
              const grid = data.map((row: any) => [...row]);
              changes.forEach(({cell, row, col, value}) => {
                grid[row][col] = {...grid[row][col], value}
              });
              setData(grid);
            }}
          />
        </div>
      </div>
    );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "projectSettings"})
});
    
const mapRecordsToProps = {
  projects: (q: QueryBuilder) => q.findRecords('project'),
  projectTypes: (q: QueryBuilder) => q.findRecords('projecttype'),
}

export default withStyles(styles, { withTheme: true })(
  withData(mapRecordsToProps)(
    connect(mapStateToProps)(SetTable) as any
  ) as any
) as any;
      