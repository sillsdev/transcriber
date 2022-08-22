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
  flatScrColNames,
  flatGenColNames,
  levScrColNames,
  levGenColNames,
} from '../model';
import localStrings from '../selector/localize';
import { AppBar, Tabs, Tab, Box } from '@mui/material';
import grey from '@mui/material/colors/grey';
import ScriptureTable from './Workflow/ScriptureTable';
import AudioTab from '../components/AudioTab/AudioTab';
import AssignmentTable from './AssignmentTable';
import TranscriptionTab from './TranscriptionTab';
import StickyRedirect from './StickyRedirect';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { PlanContext } from '../context/PlanContext';
import { useOrganizedBy, useMediaCounts, useSectionCounts } from '../crud';
import { HeadHeight } from '../App';
import { TabHeight } from '../control';

export enum tabs {
  sectionPassage = 0,
  media = 1,
  assignment = 2,
  transcription = 3,
}

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
  checkSaved: (method: () => void) => void;
}
interface ParamTypes {
  prjId: string;
  tabNm: string;
}
const ScrollableTabsButtonAuto = (props: IProps) => {
  const { t, checkSaved, plans, sections, passages, mediafiles } = props;
  const ctx = React.useContext(PlanContext);
  const { flat, scripture } = ctx.state;
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

  const colNames = React.useMemo(() => {
    return scripture && flat
      ? flatScrColNames
      : scripture && !flat
      ? levScrColNames
      : flat
      ? flatGenColNames
      : levGenColNames;
  }, [scripture, flat]);

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
        <Box sx={{ fontSize: 'x-small', color: grey[400] }}>{status}</Box>
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
    <Box
      sx={{
        flexGrow: 1,
        width: '100%',
        backgroundColor: 'background.paper',
        flexDirection: 'column',
      }}
    >
      <AppBar
        position="fixed"
        color="default"
        sx={{
          top: `${HeadHeight}px`,
          height: `${TabHeight}px`,
          left: 0,
          width: '100%',
        }}
      >
        <Tabs
          value={tab ?? 0}
          onChange={(e: any, v: number) => checkSaved(() => handleChange(e, v))}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            id="secPass"
            label={t.sectionsPassages.replace('{0}', organizedBy)}
          />
          <Tab
            id="audio"
            label={
              <Title
                text={t.media}
                status={statusMessage(
                  t.mediaStatus,
                  attached.length,
                  planMedia.length
                )}
              />
            }
          />
          <Tab
            id="assignments"
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
            id="transcriptions"
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
      <Box sx={{ pt: `${TabHeight}px` }}>
        {tab === tabs.sectionPassage && (
          <ScriptureTable {...props} colNames={colNames} />
        )}
        {tab === tabs.media && (
          <AudioTab
            {...props}
            projectplans={plans.filter((p) => p.id === plan)}
          />
        )}
        {tab === tabs.assignment && <AssignmentTable {...props} />}
        {tab === tabs.transcription && (
          <TranscriptionTab
            {...props}
            projectPlans={plans.filter((p) => p.id === plan)}
          />
        )}
      </Box>
    </Box>
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
