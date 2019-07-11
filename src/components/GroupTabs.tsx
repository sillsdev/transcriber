import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IGroupTabsStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { AppBar, Tabs, Tab, Typography } from '@material-ui/core';
import UserTable from '../components/UserTable';
import GroupTable from '../components/GroupTable';

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
  t: IGroupTabsStrings;
}

interface IProps extends IStateProps {
  changeTab?: (v: number) => void;
}

const GroupTabs = (props: IProps) => {
  const { t, changeTab } = props;
  const classes = useStyles();
  const [tab, setTab] = useGlobal<number>('tab');

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
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t.users} />
          <Tab label={t.groups} />
        </Tabs>
      </AppBar>
      {tab === 0 && (
        <TabContainer>
          <UserTable {...props} />
        </TabContainer>
      )}
      {tab === 1 && (
        <TabContainer>
          <GroupTable {...props} />
        </TabContainer>
      )}
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupTabs' }),
});

export default connect(mapStateToProps)(GroupTabs) as any;
