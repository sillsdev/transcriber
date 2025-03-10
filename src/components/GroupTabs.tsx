import { useGlobal } from '../context/GlobalContext';
import { IGroupTabsStrings } from '../model';
import { AppBar, Tabs, Tab } from '@mui/material';
import UserTable from '../components/UserTable';
import InvitationTable from '../components/InvitationTable';
import { TabBox } from '../control';
import Peer from './Peers/Peer';
import { groupTabsSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  changeTab?: (v: number) => void;
}

const GroupTabs = (props: IProps) => {
  const { changeTab } = props;
  const [tab, setTab] = useGlobal('tab'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //verified this is not used in a function 2/18/25
  const t: IGroupTabsStrings = useSelector(groupTabsSelector, shallowEqual);

  const handleChange = (event: any, value: number) => {
    setTab(value);
    if (changeTab) {
      changeTab(value);
    }
  };

  const last = 2;

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
          <Tab label={t.peerGroups} />
          {!offlineOnly && <Tab label={t.invitations} />}
        </Tabs>
      </AppBar>
      {((tab || 0) === 0 || tab > last) && <UserTable />}
      {tab === 1 && <Peer />}
      {tab === last && <InvitationTable {...props} />}
    </TabBox>
  );
};

export default GroupTabs;
