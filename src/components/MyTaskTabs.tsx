import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IMyTaskStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { AppBar, Tabs, Tab, Typography } from '@material-ui/core';
import { withData } from 'react-orbitjs';
import ToDoTable from './ToDoTable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: theme.mixins.gutters({
      flexGrow: 1,
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      flexDirection: 'column',
    }),
  })
);

interface IContainerProps {
  children: any;
}

function TabContainer(props: IContainerProps) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

interface IStateProps {
  t: IMyTaskStrings;
}
interface IRecordProps {}
interface IProps extends IStateProps, IRecordProps {
  bookCol: number;
  changeTab?: (v: number) => void;
  checkSaved: (method: () => void) => void;
  transcriber: () => void;
}

const ScrollableTabsButtonAuto = (props: IProps) => {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const { t, changeTab, checkSaved } = props;
  const classes = useStyles();
  const [tab, setTab] = useGlobal('tab');

  const handleChange = (event: any, value: number) => {
    setTab(value);
    if (changeTab) {
      changeTab(value);
    }
  };

  return (
    <div className={classes.root}>
      <AppBar position="static" color="default">
        <Tabs
          value={tab}
          onChange={(e: any, v: number) => checkSaved(() => handleChange(e, v))}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t.todo} />
          <Tab label={t.history} />
        </Tabs>
      </AppBar>
      {tab === 0 && (
        <TabContainer>
          <ToDoTable {...props} />
        </TabContainer>
      )}
      {tab === 1 && <TabContainer>History</TabContainer>}
    </div>
  );
};
const mapRecordsToProps = {};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'myTask' }),
});

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  ScrollableTabsButtonAuto
) as any) as any;
