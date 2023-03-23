import * as React from 'react';
import { Tabs, Tab, Typography, Box } from '@mui/material';
import VersionDlg from '../AudioTab/VersionDlg';

const t = {
  resourceOverview: 'Overview',
  resourceReferences: 'References',
  versions: 'Versions',
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`res-edit-tabpanel-${index}`}
      aria-labelledby={`res-edit-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `res-edit-tab-${index}`,
    'aria-controls': `res-edit-tabpanel-${index}`,
  };
}

interface IProps {
  passId: string;
}

export default function ResourceTabs({ passId }: IProps) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="resource edit tabs"
        >
          <Tab label={t.resourceOverview} {...a11yProps(0)} />
          <Tab label={t.resourceReferences} {...a11yProps(1)} />
          <Tab label={t.versions} {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        Item One
      </TabPanel>
      <TabPanel value={value} index={1}>
        Item Two
      </TabPanel>
      <TabPanel value={value} index={2}>
        <VersionDlg passId={passId} />
      </TabPanel>
    </Box>
  );
}
