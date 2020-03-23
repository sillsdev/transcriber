import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IPlanTabsStrings, Plan } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import ScriptureTable from '../components/ScriptureTable';
import MediaTab from '../components/MediaTab';
import AssignmentTable from './AssignmentTable';
import TranscriptionTab from './TranscriptionTab';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: theme.mixins.gutters({
      flexGrow: 1,
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      flexDirection: 'column',
    }) as any,
  })
);

interface IStateProps {
  t: IPlanTabsStrings;
}
interface IRecordProps {
  plans: Array<Plan>;
}
interface IProps extends IStateProps, IRecordProps {
  bookCol: number;
  changeTab?: (v: number) => void;
  setChanged?: (v: boolean) => void;
  checkSaved: (method: () => void) => void;
}

const ScrollableTabsButtonAuto = (props: IProps) => {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const { t, changeTab, bookCol, setChanged, checkSaved, plans } = props;
  const classes = useStyles();
  const [tab, setTab] = useGlobal('tab');
  const [plan] = useGlobal('plan');
  const [busy] = useGlobal('remoteBusy');

  const handleChange = (event: any, value: number) => {
    if (busy) return;
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
          <Tab label={t.sectionsPassages} />
          <Tab label={t.media} />
          <Tab label={t.assignments} />
          <Tab label={t.transcriptions} />
        </Tabs>
      </AppBar>
      {tab === 0 && (
        <>
          {bookCol !== -1 ? (
            <ScriptureTable
              {...props}
              cols={{
                SectionSeq: 0,
                SectionnName: 1,
                PassageSeq: 2,
                Book: 3,
                Reference: 4,
                Title: 5,
              }}
            />
          ) : (
            <ScriptureTable
              {...props}
              cols={{
                SectionSeq: 0,
                SectionnName: 1,
                PassageSeq: 2,
                Book: -1,
                Reference: 3,
                Title: 4,
              }}
            />
          )}
        </>
      )}
      {tab === 1 && (
        <MediaTab {...props} projectplans={plans.filter(p => p.id === plan)} />
      )}
      {tab === 2 && <AssignmentTable {...props} />}
      {tab === 3 && (
        <TranscriptionTab
          {...props}
          projectPlans={plans.filter(p => p.id === plan)}
        />
      )}
    </div>
  );
};
const mapRecordsToProps = {
  plans: (q: QueryBuilder) => q.findRecords('plan'),
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planTabs' }),
});

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(ScrollableTabsButtonAuto) as any
) as any;
