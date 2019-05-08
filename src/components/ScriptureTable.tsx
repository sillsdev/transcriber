import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IState, Set, Task, TaskSet, IProjectSettingsStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import SnackBar from './SnackBar';
import PlanTable from './PlanSheet';

const styles = (theme: Theme) => ({
  container: {
      display: 'flex',
  },
  paper: {
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

interface IStateProps {
  t: IProjectSettingsStrings;
};

interface IRecordProps {
  sets: Array<Set>;
  tasksets: Array<TaskSet>;
  tasks: Array<Task>;
};

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
};
  
export function ScriptureTable(props: IProps) {
    const { classes, t } = props;
    const [message, setMessage] = useState(<></>);
    const [columns, setColumns] = useState([
      {value: 'Section',  readOnly: true, width: 80},
      {value: 'Title',  readOnly: true, width: 280},
      {value: 'Passage', readOnly: true, width: 80},
      {value: 'Book', readOnly: true, width: 100},
      {value: 'Reference', readOnly: true, width: 180},
      {value: 'Description', readOnly: true, width: 280},
    ])
    const [data, setData] = useState([
      [1,"Luke wrote this book about Jesus for Theophilus",'','LUK',"Section 1:1–4",''],
      ['','',1,'LUK',"1:1-4",''],
      [2,"An angel said that John the Baptizer would be born",'','LUK',"Section 1:5–25",''],
      ['','',1,'LUK',"1:5-7",''],
      ['','',2,'LUK',"1:8-10",''],
      ['','',3,'LUK',"1:11-17",''],
      ['','',4,'LUK',"1:18-20",''],
      ['','',5,'LUK',"1:21-25",''],
      [3,"An angel told Mary that Jesus would be born",'','LUK',"Section 1:26–38",''],
      ['','',1,'LUK',"1:26-28",''],
      ['','',2,'LUK',"1:29-34",''],
      ['','',3,'LUK',"1:35-38",''],
      [4,"Mary visited Elizabeth",'','LUK',"Section 1:39–45",''],
      ['','',1,'LUK',"1:39-45",''],
      [5,"Mary praised God",'','LUK',"Section 1:46–56",''],
      ['','',1,'LUK',"1:46-56",''],
      [6,"John the Baptizer was born and received his name",'','LUK',"Section 1:57–66",''],
      ['','',1,'LUK',"1:57-58",''],
      ['','',2,'LUK',"1:59-64",''],
      ['','',3,'LUK',"1:65-66",''],
      [7,"Zechariah prophesied and praised God",'','LUK',"Section 1:67–80",''],
      ['','',1,'LUK',"1:67-80",''],
    ])

    const handleMessageReset = () => { setMessage(<></>) }

    return (
      <div className={classes.container}>
        <PlanTable
          columns={columns}
          rowData={data as any[][]}
        />
        <SnackBar {...props} message={message} reset={handleMessageReset} />
      </div>
    );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "projectSettings"})
});
    
const mapRecordsToProps = {
  sets: (q: QueryBuilder) => q.findRecords('set'),
  tasks: (q: QueryBuilder) => q.findRecords('task'),
  tasksets: (q: QueryBuilder) => q.findRecords('taskset'),
}

export default withStyles(styles, { withTheme: true })(
  withData(mapRecordsToProps)(
    connect(mapStateToProps)(ScriptureTable) as any
  ) as any
) as any;
      