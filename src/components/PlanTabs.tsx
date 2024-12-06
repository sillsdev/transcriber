import React, { useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useParams } from 'react-router-dom';
import {
  IPlanTabsStrings,
  Plan,
  Section,
  Passage,
  flatScrColNames,
  flatGenColNames,
  levScrColNames,
  levGenColNames,
  MediaFileD,
} from '../model';
import { AppBar, Tabs, Tab, Box } from '@mui/material';
import grey from '@mui/material/colors/grey';
import ScriptureTable from './Sheet/ScriptureTable';
import AudioTab from '../components/AudioTab/AudioTab';
import AssignmentTable from './AssignmentTable';
import TranscriptionTab from './TranscriptionTab';
import StickyRedirect from './StickyRedirect';
import { PlanContext } from '../context/PlanContext';
import { useOrganizedBy, useMediaCounts, useSectionCounts } from '../crud';
import { HeadHeight } from '../App';
import { TabHeight } from '../control';
import { useOrbitData } from '../hoc/useOrbitData';
import { shallowEqual, useSelector } from 'react-redux';
import { planTabsSelector } from '../selector';

export enum tabs {
  sectionPassage = 0,
  media = 1,
  assignment = 2,
  transcription = 3,
}

interface IProps {
  checkSaved: (method: () => void) => void;
}
const ScrollableTabsButtonAuto = (props: IProps) => {
  const { checkSaved } = props;
  const t: IPlanTabsStrings = useSelector(planTabsSelector, shallowEqual);
  const plans = useOrbitData<Plan[]>('plan');
  const sections = useOrbitData<Section[]>('section');
  const passages = useOrbitData<Passage[]>('passage');
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const ctx = React.useContext(PlanContext);
  const { flat, scripture, sectionArr } = ctx.state;
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [plan] = useGlobal('plan');
  const [tab, setTab] = useGlobal('tab');
  const [busy] = useGlobal('remoteBusy');
  const { prjId, tabNm } = useParams();
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
        {tab === tabs.media && <AudioTab />}
        {tab === tabs.assignment && <AssignmentTable />}
        {tab === tabs.transcription && (
          <TranscriptionTab
            {...props}
            projectPlans={plans.filter((p) => p.id === plan)}
            sectionArr={sectionArr}
          />
        )}
      </Box>
    </Box>
  );
};

export default ScrollableTabsButtonAuto;
