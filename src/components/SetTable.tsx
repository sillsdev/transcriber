import React, { useState, useEffect } from 'react';
import ProjectType from '../model/projectType';
import { connect } from 'react-redux';
import { IState, Project, IProjectSettingsStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';
import AddIcon from '@material-ui/icons/Add';
import DataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import './SetTable.css';
import { string } from 'prop-types';

const styles = (theme: Theme) => ({
  container: {
      display: 'flex',
      margin: theme.spacing.unit * 4,
  },
  paper: {
      paddingLeft: theme.spacing.unit * 4,
  },
  actions: theme.mixins.gutters({
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right'
  }),
  button: {
    margin: theme.spacing.unit
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
});

interface IChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

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

    const handleAdd = () => alert('add');
    const handleSave = () => alert('save');

    const handleValueRender = (cell: any) => cell.value;

    const handleCellsChanged = (changes: Array<IChange>) => {
      const grid = data.map((row: any) => [...row]);
      changes.forEach(({cell, row, col, value}: IChange) => {
        grid[row][col] = {...grid[row][col], value}
      });
      setData(grid);
    };

    const handleContextMenu = (e: MouseEvent, cell: any) => cell.readOnly ? e.preventDefault() : null;

    const handlePaste = (s: string) => {
        const widths = [60, 80, 120, 400]
        const blankLines = /\n\t*\n/;
        const chunks = s.split(blankLines)
        const lines = chunks.join('\n').trim().split('\n')
        if (lines[0].split('\t').length === 4) {
          const grid = lines.map((row:string, i:number) => 
            row.split('\t').map((val: string, j:number) => {
              return {
                value: val,
                readOnly: (i === 0),
                width: widths[j],
                className: ((i === 0 || lines[i].slice(0,1) === '\t')? 'pass': 'set') +
                  (j < 2? " num": "")
              }
            }));
          setData(grid);
        }
      return Array<Array<string>>();
    }

    return (
      <div className={classes.container}>
        <div className={classes.paper}>
          <div className={classes.actions}>
            <Button
              key="add"
              aria-label={'Add'}
              variant="contained"
              className={classes.button}
              onClick={handleAdd}
            >
              {'Add'}
              <AddIcon className={classes.icon} />
            </Button>
            <Button
              key="save"
              aria-label={'Save'}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleSave}
            >
              {'Save'}
              <SaveIcon className={classes.icon} />
            </Button>
          </div>

          <DataSheet
            data={data as any[][]}
            valueRenderer={handleValueRender}
            onContextMenu={handleContextMenu}
            onCellsChanged={handleCellsChanged}
            parsePaste={handlePaste}
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
      