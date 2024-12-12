import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  Suspense,
} from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLocation, useParams } from 'react-router-dom';
import { Grid, debounce, Paper, Box, SxProps, Stack } from '@mui/material';

import AppHead from '../components/App/AppHead';
import { HeadHeight } from '../App';
import {
  PassageDetailProvider,
  PassageDetailContext,
} from '../context/PassageDetailContext';
import StickyRedirect from '../components/StickyRedirect';
import DiscussionList from '../components/Discussions/DiscussionList';
import { WorkflowSteps } from '../components/PassageDetail/WorkflowSteps';
import PassageDetailSectionPassage from '../components/PassageDetail/PassageDetailSectionPassage';
import PassageDetailStepComplete from '../components/PassageDetail/PassageDetailStepComplete';
import PassageDetailArtifacts from '../components/PassageDetail/Internalization/PassageDetailArtifacts';
import TeamCheckReference from '../components/PassageDetail/TeamCheckReference';
import PassageDetailPlayer from '../components/PassageDetail/PassageDetailPlayer';
import PassageDetailRecord from '../components/PassageDetail/PassageDetailRecord';
import PassageDetailItem from '../components/PassageDetail/PassageDetailItem';
import PassageDetailMarkVerses from '../components/PassageDetail/PassageDetailMarkVerses';
import PassageDetailTranscribe from '../components/PassageDetail/PassageDetailTranscribe';
import PassageDetailChooser from '../components/PassageDetail/PassageDetailChooser';
import ConsultantCheck from '../components/PassageDetail/ConsultantCheck';
import TranscriptionTab from '../components/TranscriptionTab';
import {
  ArtifactTypeSlug,
  remoteIdGuid,
  ToolSlug,
  useProjectType,
  useStepTool,
  useUrlContext,
} from '../crud';
import { Plan, IToolStrings } from '../model';
import { NamedRegions } from '../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { toolSelector } from '../selector';
import Busy from '../components/Busy';
import { RecordKeyMap } from '@orbit/records';
import PassageDetailParatextIntegration from '../components/PassageDetail/PassageDetailParatextIntegration';
import { PassageDetailDiscuss } from '../components/PassageDetail/PassageDetailDiscuss';
import { AllotmentWrapper } from '../control/AllotmentWrapper';
import { Allotment } from 'allotment';

const KeyTerms = React.lazy(
  () => import('../components/PassageDetail/Keyterms/KeyTerms')
);

const descProps = { overflow: 'hidden', textOverflow: 'ellipsis' } as SxProps;
const rowProps = { alignItems: 'center', whiteSpace: 'nowrap' } as SxProps;

interface PGProps {
  minWidth: number;
  onMinWidth: (width: number) => void;
}

const PassageDetailGrids = ({ minWidth, onMinWidth }: PGProps) => {
  const INIT_PLAYERPANE_HEIGHT = 150 + 48; // 48 for possible passage chooser
  const [plan] = useGlobal('plan');
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const widthRef = React.useRef(window.innerWidth);
  //const [myPlayerSize, setMyPlayerSize] = useState(INIT_PLAYER_HEIGHT);

  const [topFilter, setTopFilter] = useState(false);
  const [memory] = useGlobal('memory');
  const ctx = useContext(PassageDetailContext);
  const {
    currentstep,
    discussionSize,
    setDiscussionSize,
    playerSize,
    chooserSize,
    setPlayerSize,
    orgWorkflowSteps,
    mediafileId,
    sectionArr,
  } = ctx.state;
  const minWidthRef = React.useRef(800);
  const { tool, settings } = useStepTool(currentstep);
  const [horizSize, setHorizSize] = useState(window.innerWidth - 450);
  const discussionSizeRef = React.useRef(discussionSize);
  const t = useSelector(toolSelector, shallowEqual) as IToolStrings;

  useEffect(() => {
    discussionSizeRef.current = discussionSize;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussionSize]);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  const artifactId = useMemo(() => {
    if (settings) {
      var id = JSON.parse(settings).artifactTypeId;
      if (id)
        return (
          remoteIdGuid('artifacttype', id, memory?.keyMap as RecordKeyMap) ?? id
        );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const [communitySlugs] = useState([
    ArtifactTypeSlug.Retell,
    ArtifactTypeSlug.QandA,
  ]);
  const [phraseBackTranslationSlugs] = useState([
    ArtifactTypeSlug.PhraseBackTranslation,
  ]);
  const [wholeBackTranslationSlugs] = useState([
    ArtifactTypeSlug.WholeBackTranslation,
  ]);

  const handleVertSplitSize = debounce((e: number[]) => {
    setHorizSize(e[0]);
    setDiscussionSize({
      width: widthRef.current - e[0],
      height: discussionSize.height,
    });
  }, 500);

  const handleHorzSplitSize = debounce((e: number[]) => {
    setPlayerSize(e[0]);
  }, 500);

  const setDimensions = () => {
    const newWidth = Math.max(window.innerWidth, minWidthRef.current);
    setWidth(newWidth);
    setHeight(window.innerHeight);
    let newDiscWidth = discussionSizeRef.current.width;
    if (newDiscWidth > newWidth - minWidthRef.current + 450) newDiscWidth = 450;
    const newDiscHeight = window.innerHeight - 275;
    if (
      discussionSizeRef.current.height !== newDiscHeight ||
      discussionSizeRef.current.width !== newDiscWidth
    )
      setDiscussionSize({
        width: newDiscWidth, //should we be smarter here?
        height: newDiscHeight,
      });
    setHorizSize(newWidth - newDiscWidth);
    setPlayerSize(INIT_PLAYERPANE_HEIGHT);
    // setPaperStyle({ width: window.innerWidth - 10 });
  };

  useEffect(() => {
    if (tool === ToolSlug.Record) {
      onMinWidth(880);
    } else if (tool === ToolSlug.Transcribe && artifactId) {
      onMinWidth(1175);
    } else if (
      tool === ToolSlug.Transcribe ||
      tool === ToolSlug.Community ||
      tool === ToolSlug.PhraseBackTranslate
    ) {
      onMinWidth(1050);
    } else if (tool === ToolSlug.KeyTerm) {
      onMinWidth(955);
    } else {
      onMinWidth(800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  const handleFilter = (filtered: boolean) => {
    setTopFilter(filtered);
  };

  useEffect(() => {
    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    minWidthRef.current = minWidth;
    setDimensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minWidth]);

  const plans = useMemo(() => {
    const plans = memory.cache.query((q) => q.findRecords('plan')) as Plan[];
    return plans.filter((p) => p.id === plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        paddingTop: `${HeadHeight}px`,
      }}
    >
      <Grid container direction="row" sx={rowProps}>
        <Grid container direction="row" sx={rowProps}>
          <Grid item sx={rowProps} xs={6}>
            <PassageDetailSectionPassage />
          </Grid>
          <Grid item id="tool" sx={rowProps} xs={3}>
            {tool && t.hasOwnProperty(tool) ? t.getString(tool) : tool}
          </Grid>
          <Grid
            item
            id="stepcomplete"
            sx={{ display: 'flex', justifyContent: 'flex-end' }}
            xs={3}
          >
            <PassageDetailStepComplete />
          </Grid>
        </Grid>
        <Grid item sx={descProps} xs={12}>
          <WorkflowSteps />
        </Grid>
        {tool === ToolSlug.Resource && (
          <Grid container direction="row" sx={rowProps}>
            <Grid item xs={12}>
              <Grid container>
                <PassageDetailChooser width={width - 24} sx={{ pl: 2 }} />
                <PassageDetailArtifacts />
              </Grid>
            </Grid>
          </Grid>
        )}
        {tool === ToolSlug.Paratext && (
          <Stack>
            <PassageDetailChooser width={width - 24} sx={{ pl: 2 }} />
            <PassageDetailParatextIntegration />
          </Stack>
        )}
        {(tool === ToolSlug.Discuss ||
          tool === ToolSlug.TeamCheck ||
          tool === ToolSlug.Record ||
          tool === ToolSlug.Verses ||
          tool === ToolSlug.Transcribe ||
          tool === ToolSlug.ConsultantCheck ||
          tool === ToolSlug.KeyTerm) && (
          <Paper
            key={currentstep}
            sx={{ p: 0, margin: 'auto', width: `calc(100% - 32px)` }}
          >
            <AllotmentWrapper
              horiz={`${widthRef.current - 48}px`}
              vert={`${playerSize + 500}px`}
            >
              <Allotment
                defaultSizes={[
                  widthRef.current - discussionSize.width - 16,
                  discussionSize.width,
                ]}
                // size={horizSize}
                onChange={handleVertSplitSize}
              >
                <Allotment.Pane>
                  {tool !== ToolSlug.Transcribe &&
                  tool !== ToolSlug.Verses &&
                  tool !== ToolSlug.Record &&
                  tool !== ToolSlug.ConsultantCheck ? (
                    <Allotment
                      vertical
                      defaultSizes={[playerSize, height - 280]}
                      // minSize={INIT_PLAYERPANE_HEIGHT + 48} // 48 for chooser
                      // maxSize={height - 280}
                      onChange={handleHorzSplitSize}
                    >
                      <Allotment.Pane>
                        <PassageDetailChooser
                          width={widthRef.current - discussionSize.width - 16}
                        />
                        {(tool !== ToolSlug.KeyTerm || mediafileId) && (
                          <PassageDetailPlayer chooserReduce={chooserSize} />
                        )}
                      </Allotment.Pane>
                      <Allotment.Pane>
                        {tool === ToolSlug.TeamCheck && <TeamCheckReference />}
                        {tool === ToolSlug.KeyTerm && (
                          <Suspense fallback={<Busy />}>
                            <KeyTerms
                              width={width - discussionSize.width - 16}
                            />
                          </Suspense>
                        )}
                        {tool === ToolSlug.Discuss && (
                          <PassageDetailDiscuss
                            width={width - discussionSize.width - 16}
                            currentStep={currentstep}
                          />
                        )}
                      </Allotment.Pane>
                    </Allotment>
                  ) : (
                    <Grid item sx={descProps} xs={12}>
                      <PassageDetailChooser
                        width={width - discussionSize.width - 16}
                      />
                      {tool === ToolSlug.Verses && (
                        <PassageDetailMarkVerses
                          width={width - discussionSize.width - 16}
                        />
                      )}
                      {tool === ToolSlug.Transcribe && (
                        <PassageDetailTranscribe
                          width={width - discussionSize.width - 16}
                          artifactTypeId={artifactId}
                          onFilter={handleFilter}
                        />
                      )}
                      {tool === ToolSlug.Record && (
                        <PassageDetailRecord
                          width={width - discussionSize.width - 16}
                        />
                      )}
                      {tool === ToolSlug.ConsultantCheck && (
                        <ConsultantCheck
                          width={width - discussionSize.width - 16}
                        />
                      )}
                    </Grid>
                  )}
                </Allotment.Pane>
                {!topFilter && Boolean(mediafileId) && (
                  <Allotment.Pane>
                    <Grid item xs={12} sm container>
                      <Grid item container direction="column">
                        <DiscussionList />
                      </Grid>
                    </Grid>
                  </Allotment.Pane>
                )}
              </Allotment>
            </AllotmentWrapper>
          </Paper>
        )}
        {(tool === ToolSlug.Community ||
          tool === ToolSlug.PhraseBackTranslate ||
          tool === ToolSlug.WholeBackTranslate) && (
          <Grid key={currentstep} container direction="row" sx={rowProps}>
            <Grid item xs={12}>
              <PassageDetailItem
                width={width}
                slugs={
                  tool === ToolSlug.Community
                    ? communitySlugs
                    : tool === ToolSlug.PhraseBackTranslate
                    ? phraseBackTranslationSlugs
                    : wholeBackTranslationSlugs
                }
                showTopic={tool === ToolSlug.Community}
                segments={
                  tool === ToolSlug.PhraseBackTranslate
                    ? NamedRegions.BackTranslation
                    : undefined
                }
              />
            </Grid>
          </Grid>
        )}

        {(tool === ToolSlug.Export || tool === ToolSlug.Done) && (
          <Grid container>
            <Grid item xs={12}>
              <PassageDetailChooser width={width - 16} />
              {tool === ToolSlug.Export && (
                <TranscriptionTab
                  projectPlans={plans}
                  floatTop
                  step={currentstep}
                  orgSteps={orgWorkflowSteps}
                  sectionArr={sectionArr}
                />
              )}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export const PassageDetail = () => {
  const { prjId } = useParams();
  const { pathname } = useLocation();
  const setUrlContext = useUrlContext();
  const [view, setView] = useState('');
  const [projType] = useGlobal('projType');
  const [user] = useGlobal('user');
  const [minWidth, setMinWidth] = useState(800);
  const { setProjectType } = useProjectType();

  useEffect(() => {
    const projectId = setUrlContext(prjId ?? '');
    if (user && projType === '') {
      var tmp = setProjectType(projectId);
      if (!tmp) {
        // If user is set but we don't have this project, go to the team screen
        setView('/team');
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handleMinWidth = (width: number) => {
    setMinWidth(width);
  };

  if (view !== '' && view !== pathname) return <StickyRedirect to={view} />;

  return (
    <Box sx={{ flexGrow: 1, minWidth: `${minWidth}px`, minHeight: '536px' }}>
      <AppHead switchTo={true} />
      <PassageDetailProvider>
        <PassageDetailGrids minWidth={minWidth} onMinWidth={handleMinWidth} />
      </PassageDetailProvider>
    </Box>
  );
};
export default PassageDetail;
