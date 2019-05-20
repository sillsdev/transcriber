import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IState, IPlanTabsStrings } from '../model';
import localStrings from '../selector/localize';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import ScriptureTable from '../components/ScriptureTable'

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

const styles = (theme: Theme) => ({
  root: theme.mixins.gutters({
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    flexDirection: "column",
  }),
});

interface IStateProps {
    t: IPlanTabsStrings;
}

interface IProps extends IStateProps, WithStyles<typeof styles>{
    changeTab?: (v: number) => void;
};

const ScrollableTabsButtonAuto = (props: IProps) => {
    const { classes, t, changeTab } = props;
    const [tab, setTab] = useState(0);

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
            <Tab label={t.sectionsPassages} />
            <Tab label={t.media} />
            <Tab label={t.assignments} />
            <Tab label={t.transcriptions} />
            </Tabs>
        </AppBar>
        {tab === 0 && <TabContainer><ScriptureTable {...props} /></TabContainer>}
        {tab === 1 && <TabContainer>{t.media}</TabContainer>}
        {tab === 2 && <TabContainer>{t.assignments}</TabContainer>}
        {tab === 3 && <TabContainer>{t.transcriptions}</TabContainer>}
        </div>
    );
}

const mapStateToProps = (state: IState): IStateProps => ({
    t: localStrings(state, {layout: "planTabs"}),
  });
      
export default withStyles(styles, { withTheme: true })(
    connect(mapStateToProps)(ScrollableTabsButtonAuto) as any
) as any;
  