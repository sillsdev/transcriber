import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IGroupTabsStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import UserTable from '../components/UserTable';
import GroupSettings from '../components/GroupSettings/GroupSettings';
import InvitationTable from '../components/InvitationTable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      flexDirection: 'column',
    },
  })
);

interface IStateProps {
  t: IGroupTabsStrings;
}

interface IProps extends IStateProps {
  changeTab?: (v: number) => void;
}

const GroupTabs = (props: IProps) => {
  const { t, changeTab } = props;
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
          value={tab || 0}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t.users} />
          <Tab label={t.roles} />
          <Tab label={t.invitations} />
        </Tabs>
      </AppBar>
      {((tab || 0) === 0 || tab > 2) && <UserTable {...props} />}
      {tab === 1 && <GroupSettings {...props} />}
      {tab === 2 && <InvitationTable {...props} />}
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupTabs' }),
});

export default connect(mapStateToProps)(GroupTabs) as any;
