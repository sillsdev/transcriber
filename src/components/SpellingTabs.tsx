import React from 'react';
import { ISpellingStrings } from '../model';
import { AppBar, Tabs, Tab, Typography, Box } from '@mui/material';
import SpellLanguagePicker from './SpellLanguagePicker';
import CustomList from './SpellCustomList';
import { spellingSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`spelling-tabpanel-${index}`}
      aria-labelledby={`spelling-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `spelling-tab-${index}`,
    'aria-controls': `spelling-tabpanel-${index}`,
  };
}

interface IProps {
  codes: string[];
  setCodes: (codes: string[]) => void;
  setChanged: (changed: boolean) => void;
}

export function SpellingTabs(props: IProps) {
  const { codes, setCodes, setChanged } = props;
  const [value, setValue] = React.useState(0);
  const t: ISpellingStrings = useSelector(spellingSelector, shallowEqual);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };
  const handleCodes = (codes: string[]) => {
    setCodes(codes);
    setChanged(true);
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.paper' }}>
      <AppBar position="static">
        <Tabs value={value} onChange={handleChange} aria-label="spelling tabs">
          <Tab label={t.dictionaries} {...a11yProps(0)} />
          <Tab label={t.custom} {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
        <SpellLanguagePicker codes={codes} onSetCodes={handleCodes} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CustomList />
      </TabPanel>
    </Box>
  );
}

export default SpellingTabs;
