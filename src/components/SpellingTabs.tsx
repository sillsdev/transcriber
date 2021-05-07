import React from 'react';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { IState, ISpellingStrings } from '../model';
import { makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import SpellLanguagePicker from './SpellLanguagePicker';
import CustomList from './SpellCustomList';

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

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

interface IStateProps {
  t: ISpellingStrings;
}

interface IProps extends IStateProps {
  codes: string[];
  setCodes: (codes: string[]) => void;
  setChanged: (changed: boolean) => void;
}

export function SpellingTabs(props: IProps) {
  const { codes, setCodes, setChanged, t } = props;
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };
  const handleCodes = (codes: string[]) => {
    setCodes(codes);
    setChanged(true);
  };

  return (
    <div className={classes.root}>
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
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'spelling' }),
});

export default connect(mapStateToProps)(SpellingTabs);
