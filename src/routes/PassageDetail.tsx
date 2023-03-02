import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  PropsWithChildren,
  Suspense,
} from 'react';
import { useGlobal } from 'reactn';
import { useLocation, useParams } from 'react-router-dom';
import { Grid, debounce, Paper, Box, SxProps } from '@mui/material';

import styled from 'styled-components';
import AppHead from '../components/App/AppHead';
import {
  default as SplitPaneBar,
  Pane as PaneBar,
  PaneProps,
  SplitPaneProps,
} from 'react-split-pane';
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
import PassageDetailTranscribe from '../components/PassageDetail/PassageDetailTranscribe';
import PassageDetailChooser from '../components/PassageDetail/PassageDetailChooser';
import IntegrationTab from '../components/Integration';
import TranscriptionTab from '../components/TranscriptionTab';
import {
  ArtifactTypeSlug,
  remoteIdGuid,
  ToolSlug,
  useArtifactType,
  useProjectType,
  useRole,
  useStepTool,
  useUrlContext,
} from '../crud';
import { Plan, IToolStrings } from '../model';
import { NamedRegions } from '../utils';
import { memory } from '../schema';
import { useSelector, shallowEqual } from 'react-redux';
import { toolSelector } from '../selector';
import { QueryBuilder } from '@orbit/data';
import Busy from '../components/Busy';

const KeyTerms = React.lazy(
  () => import('../components/PassageDetail/Keyterms/KeyTerms')
);

const minWidth = 800;

const descProps = { overflow: 'hidden', textOverflow: 'ellipsis' } as SxProps;
const rowProps = { alignItems: 'center', whiteSpace: 'nowrap' } as SxProps;

const Wrapper = styled.div`
  .Resizer {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    background: #000;
    opacity: 0.2;
    z-index: 1;
    -moz-background-clip: padding;
    -webkit-background-clip: padding;
    background-clip: padding-box;
  }

  .Resizer:hover {
    -webkit-transition: all 2s ease;
    transition: all 2s ease;
  }

  .Resizer.horizontal {
    height: 11px;
    margin: -5px 0;
    border-top: 5px solid rgba(255, 255, 255, 0);
    border-bottom: 5px solid rgba(255, 255, 255, 0);
    cursor: row-resize;
    width: 100%;
  }

  .Resizer.horizontal:hover {
    border-top: 5px solid rgba(0, 0, 0, 0.5);
    border-bottom: 5px solid rgba(0, 0, 0, 0.5);
  }

  .Resizer.vertical {
    width: 11px;
    margin: 0 -5px;
    border-left: 5px solid rgba(255, 255, 255, 0);
    border-right: 5px solid rgba(255, 255, 255, 0);
    cursor: col-resize;
  }

  .Resizer.vertical:hover {
    border-left: 5px solid rgba(0, 0, 0, 0.5);
    border-right: 5px solid rgba(0, 0, 0, 0.5);
  }
  .Pane1 {
    // background-color: blue;
    display: flex;
    min-height: 0;
  }
  .Pane2 {
    // background-color: red;
    display: flex;
    min-height: 0;
  }
`;

const SplitPane = (props: SplitPaneProps & PropsWithChildren) => {
  return <SplitPaneBar {...props} />;
};

const Pane = (props: PaneProps & PropsWithChildren) => {
  return <PaneBar {...props} className={props.className || 'pane'} />;
};

const PassageDetailGrids = () => {
  const INIT_PLAYERPANE_HEIGHT = 130;
  const SMALLPLAYERDIFF = 25;
  const [plan] = useGlobal('plan');
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  //const [myPlayerSize, setMyPlayerSize] = useState(INIT_PLAYER_HEIGHT);

  const [topFilter, setTopFilter] = useState(false);
  const ctx = useContext(PassageDetailContext);
  const {
    currentstep,
    discussionSize,
    setDiscussionSize,
    setPlayerSize,
    orgWorkflowSteps,
    mediafileId,
  } = ctx.state;

  const { tool, settings } = useStepTool(currentstep);
  const { slugFromId } = useArtifactType();
  const { userIsAdmin } = useRole();
  const artifactId = useMemo(() => {
    if (settings) {
      var id = JSON.parse(settings).artifactTypeId;
      if (id) return remoteIdGuid('artifacttype', id, memory.keyMap) ?? id;
    }
    return null;
  }, [settings]);

  const artifactSlug = useMemo(() => {
    return artifactId ? slugFromId(artifactId) : ArtifactTypeSlug.Vernacular;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactId]);

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
  const t = useSelector(toolSelector, shallowEqual) as IToolStrings;

  const handleVertSplitSize = debounce((e: number) => {
    setDiscussionSize({ width: width - e, height: discussionSize.height });
  }, 50);

  const handleHorzSplitSize = debounce((e: number) => {
    setPlayerSize(e + SMALLPLAYERDIFF);
  }, 50);

  const setDimensions = () => {
    setWidth(Math.max(window.innerWidth, minWidth));
    setHeight(window.innerHeight);
    setDiscussionSize({
      width: discussionSize.width, //should we be smarter here?
      height: window.innerHeight - 330,
    });
    setPlayerSize(INIT_PLAYERPANE_HEIGHT + SMALLPLAYERDIFF);
    // setPaperStyle({ width: window.innerWidth - 10 });
  };

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

  const plans = useMemo(() => {
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    return plans.filter((p) => p.id === plan);
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
          {userIsAdmin && (
            <Grid
              item
              id="stepcomplete"
              sx={{ display: 'flex', justifyContent: 'flex-end' }}
              xs={3}
            >
              <PassageDetailStepComplete />
            </Grid>
          )}
        </Grid>
        <Grid item sx={descProps} xs={12}>
          <WorkflowSteps />
        </Grid>
        <Grid item xs={12}>
          <PassageDetailChooser />
        </Grid>
        {tool === ToolSlug.Resource && (
          <Grid container direction="row" sx={rowProps}>
            <Grid item xs={12}>
              <Grid container>
                <PassageDetailArtifacts />
              </Grid>
            </Grid>
          </Grid>
        )}
        {tool === ToolSlug.Paratext && (
          <IntegrationTab
            artifactType={artifactSlug as ArtifactTypeSlug}
            passage={ctx.state.passage}
            setStepComplete={ctx.state.setStepComplete as any}
            currentstep={currentstep}
          />
        )}
        {(tool === ToolSlug.Discuss ||
          tool === ToolSlug.TeamCheck ||
          tool === ToolSlug.Record ||
          tool === ToolSlug.Transcribe ||
          tool === ToolSlug.KeyTerm) && (
          <Paper sx={{ p: 2, margin: 'auto', width: `calc(100% - 32px)` }}>
            <Wrapper>
              <SplitPane
                defaultSize={width - discussionSize.width - 16}
                style={{ position: 'static' }}
                split="vertical"
                onChange={handleVertSplitSize}
              >
                <Pane>
                  <SplitPane
                    defaultSize={INIT_PLAYERPANE_HEIGHT}
                    minSize={INIT_PLAYERPANE_HEIGHT}
                    maxSize={height - 280}
                    style={{ position: 'static' }}
                    split="horizontal"
                    onChange={handleHorzSplitSize}
                  >
                    <Pane>
                      {tool === ToolSlug.Record && (
                        <Grid item sx={descProps} xs={12}>
                          <PassageDetailRecord />
                        </Grid>
                      )}
                      {tool !== ToolSlug.Record &&
                        tool !== ToolSlug.Transcribe &&
                        (tool !== ToolSlug.KeyTerm || mediafileId) && (
                          <Grid item sx={descProps} xs={12}>
                            <PassageDetailPlayer />
                          </Grid>
                        )}
                    </Pane>
                    <Pane>
                      {tool === ToolSlug.TeamCheck && (
                        <Grid item sx={descProps} xs={12}>
                          <TeamCheckReference />
                        </Grid>
                      )}
                      {tool === ToolSlug.Transcribe && (
                        <Grid item sx={descProps} xs={12}>
                          <PassageDetailTranscribe
                            width={width - discussionSize.width - 16}
                            artifactTypeId={artifactId}
                            onFilter={handleFilter}
                          />
                        </Grid>
                      )}
                      {tool === ToolSlug.KeyTerm && (
                        <Grid item sx={descProps} xs={12}>
                          <Suspense fallback={<Busy />}>
                            <KeyTerms />
                          </Suspense>
                        </Grid>
                      )}
                    </Pane>
                  </SplitPane>
                </Pane>
                {!topFilter && (
                  <Pane>
                    <Grid item xs={12} sm container>
                      <Grid item container direction="column">
                        <DiscussionList />
                      </Grid>
                    </Grid>
                  </Pane>
                )}
              </SplitPane>
            </Wrapper>
          </Paper>
        )}
        {(tool === ToolSlug.Community ||
          tool === ToolSlug.PhraseBackTranslate ||
          tool === ToolSlug.WholeBackTranslate) && (
          <Grid container direction="row" sx={rowProps}>
            <Grid item xs={12}>
              <Grid container>
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
          </Grid>
        )}

        {tool === ToolSlug.Export && (
          <Grid container>
            <Grid item xs={12}>
              <TranscriptionTab
                projectPlans={plans}
                floatTop
                step={currentstep}
                orgSteps={orgWorkflowSteps}
              />
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

  if (view !== '' && view !== pathname) return <StickyRedirect to={view} />;

  return (
    <Box sx={{ flexGrow: 1, minWidth: `${minWidth}px`, minHeight: '700px' }}>
      <AppHead switchTo={true} />
      <PassageDetailProvider>
        <PassageDetailGrids />
      </PassageDetailProvider>
    </Box>
  );
};
export default PassageDetail;
