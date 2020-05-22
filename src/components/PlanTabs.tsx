import React from 'react';
import { useGlobal } from 'reactn';
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
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { DrawerWidth, HeadHeight } from '../routes/drawer';
import { related } from '../utils';

export const TabHeight = 48;
export enum tabs {
  sectionPassage = 0,
  media = 1,
  associate = 2,
  assignment = 3,
  transcription = 4,
}

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
      left: `${DrawerWidth}px`,
      width: `calc(100% - ${DrawerWidth}px)`,
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
  changeTab?: (v: number) => void;
  checkSaved: (method: () => void) => void;
}

const ScrollableTabsButtonAuto = (props: IProps) => {
  const {
    t,
    changeTab,
    bookCol,
    checkSaved,
    plans,
    sections,
    passages,
    mediafiles,
  } = props;
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

  const planSections = sections.filter((s) => related(s, 'plan') === plan);
  const planSectionIds = planSections.map((p) => p.id);
  const planPassages = passages.filter((p) =>
    planSectionIds.includes(related(p, 'section'))
  );
  const planMedia = mediafiles.filter(
    (m) => related(m, 'plan') === plan && m.attributes.versionNumber === 1
  );
  const attached = planMedia
    .map((m) => related(m, 'passage'))
    .filter((p) => p && p !== '');
  const assigned = planSections.filter(
    (s) => related(s, 'transcriber') || related(s, 'editor')
  );
  const trans = planMedia
    .map((m) => m.attributes.transcription)
    .filter((t) => t && t !== '');

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

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.bar} color="default">
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
          />
          <Tab
            label={
              <Title
                text={t.assignments}
                status={statusMessage(
                  t.sectionStatus,
                  assigned.length,
                  planSectionIds.length
                )}
              />
            }
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
