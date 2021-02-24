import React from 'react';
import { useGlobal, useEffect } from 'reactn';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  IState,
  IPlanTabsStrings,
  Plan,
  Section,
  Passage,
  MediaFile,
} from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import grey from '@material-ui/core/colors/grey';
import ScriptureTable from '../components/ScriptureTable';
import MediaTab from '../components/MediaTab';
import AssignmentTable from './AssignmentTable';
import TranscriptionTab from './TranscriptionTab';
import StickyRedirect from './StickyRedirect';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
//import { HeadHeight } from '../App';
import { useOrganizedBy, useMediaCounts, useSectionCounts } from '../crud';

export const TabHeight = 48;
export enum tabs {
  sectionPassage = 0,
  media = 1,
  associate = 2,
  assignment = 3,
  transcription = 4,
}
export const ActionHeight = 42;
const HeadHeight = 64; //can't get the one from app on initialization?!
export const tabBar = {
  top: `calc(${TabHeight}px + ${HeadHeight}px)`,
  height: `${ActionHeight}px`,
  left: 0,
  width: '100%',
};
export const tabActions = {
  paddingBottom: 16,
  display: 'flex',
  justifyContent: 'flex-end',
  '& .MuiButton-label': { fontSize: '.8rem' },
  '& .MuiButtonBase-root': { margin: '5px', padding: '2px 10px' },
  '& .MuiSvgIcon-root': { fontSize: '.9rem' },
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: theme.mixins.gutters({
      flexGrow: 1,
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      flexDirection: 'column',
    }) as any,
    bar: {
      top: `${HeadHeight}px`,
      height: `${ActionHeight}px`,
      left: 0,
      width: '100%',
    },
    content: {
      paddingTop: `${TabHeight}px`,
    },
    status: {
      fontSize: 'x-small',
      color: grey[400],
    },
  })
);

interface IStateProps {
  t: IPlanTabsStrings;
}
interface IRecordProps {
  plans: Plan[];
  sections: Section[];
  passages: Passage[];
  mediafiles: MediaFile[];
}
interface IProps extends IStateProps, IRecordProps {
  bookCol: number;
  checkSaved: (method: () => void) => void;
}
interface ParamTypes {
  prjId: string;
  tabNm: string;
}
const ScrollableTabsButtonAuto = (props: IProps) => {
  const {
    t,
    bookCol,
    checkSaved,
    plans,
    sections,
    passages,
    mediafiles,
  } = props;
  const classes = useStyles();
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [plan] = useGlobal('plan');
  const [tab, setTab] = useGlobal('tab');
  const [busy] = useGlobal('remoteBusy');
  const { prjId, tabNm } = useParams<ParamTypes>();
  const { getOrganizedBy } = useOrganizedBy();
  const [planMedia, attached, trans] = useMediaCounts(plan, mediafiles);
  const [planSectionIds, assigned, planPassages] = useSectionCounts(
    plan,
    sections,
    passages
  );

  const handleChange = (event: any, value: number) => {
    if (busy) return;
    setTab(value);
  };
  const organizedBy = getOrganizedBy(false);

  interface ITitle {
    text: string;
    status: string;
  }
  const Title = ({ text, status }: ITitle) => {
    return (
      <>
        {text}
        <div className={classes.status}>{status}</div>
      </>
    );
  };

  const statusMessage = (msg: string, val1: number, val2: number) =>
    msg.replace('{1}', val1.toString()).replace('{2}', val2.toString());

  useEffect(() => {
    if (tab === undefined) {
      setTab(tabNm && /^[0-4]+$/.test(tabNm) ? parseInt(tabNm) : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tab !== undefined && tab.toString() !== tabNm)
    return <StickyRedirect to={`/plan/${prjId}/${tab}`} />;

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.bar} color="default">
        <Tabs
          value={tab ?? 0}
          onChange={(e: any, v: number) => checkSaved(() => handleChange(e, v))}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t.sectionsPassages.replace('{0}', organizedBy)} />
          <Tab label={t.media} />
          <Tab
            label={
              <Title
                text={t.associations}
                status={statusMessage(
                  t.mediaStatus,
                  attached.length,
                  planMedia.length
                )}
              />
            }
            disabled={isOffline && !offlineOnly}
          />
          <Tab
            label={
              <Title
                text={t.assignments}
                status={statusMessage(
                  t.sectionStatus.replace('{0}', organizedBy),
                  assigned.length,
                  planSectionIds.length
                )}
              />
            }
            disabled={isOffline && !offlineOnly}
          />
          <Tab
            label={
              <Title
                text={t.transcriptions}
                status={statusMessage(
                  t.passageStatus,
                  trans.length,
                  planPassages.length
                )}
              />
            }
          />
        </Tabs>
      </AppBar>
      <div className={classes.content}>
        {tab === tabs.sectionPassage && (
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
        {tab === tabs.media && (
          <MediaTab
            {...props}
            projectplans={plans.filter((p) => p.id === plan)}
          />
        )}
        {tab === tabs.associate && (
          <MediaTab
            {...props}
            projectplans={plans.filter((p) => p.id === plan)}
            attachTool={true}
          />
        )}
        {tab === tabs.assignment && <AssignmentTable {...props} />}
        {tab === tabs.transcription && (
          <TranscriptionTab
            {...props}
            projectPlans={plans.filter((p) => p.id === plan)}
          />
        )}
      </div>
    </div>
  );
};
const mapRecordsToProps = {
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planTabs' }),
});

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(ScrollableTabsButtonAuto) as any
) as any;
