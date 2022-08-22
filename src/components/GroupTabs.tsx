import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IGroupTabsStrings } from '../model';
import localStrings from '../selector/localize';
import { AppBar, Tabs, Tab } from '@mui/material';
import UserTable from '../components/UserTable';
import GroupSettings from '../components/GroupSettings/GroupSettings';
import InvitationTable from '../components/InvitationTable';
import { TabBox } from '../control';
import Peer from './Peers/Peer';

interface IStateProps {
  t: IGroupTabsStrings;
}

interface IProps extends IStateProps {
  changeTab?: (v: number) => void;
}

const GroupTabs = (props: IProps) => {
  const { t, changeTab } = props;
  const [tab, setTab] = useGlobal('tab');
  const [offlineOnly] = useGlobal('offlineOnly');

  const handleChange = (event: any, value: number) => {
    setTab(value);
    if (changeTab) {
      changeTab(value);
    }
  };

  const last = 3;

  return (
    <TabBox>
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
          <Tab label={t.peerGroups} />
          {!offlineOnly && <Tab label={t.invitations} />}
        </Tabs>
      </AppBar>
      {((tab || 0) === 0 || tab > last) && <UserTable {...props} />}
      {tab === 1 && <GroupSettings {...props} />}
      {tab === 2 && <Peer />}
      {tab === last && <InvitationTable {...props} />}
    </TabBox>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupTabs' }),
});

export default connect(mapStateToProps)(GroupTabs) as any;
