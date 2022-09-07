import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { useLocation, useParams } from 'react-router-dom';
import {
  makeStyles,
  createStyles,
  Theme,
  Grid,
  debounce,
  Paper,
} from '@material-ui/core';

import styled from 'styled-components';
import AppHead from '../components/App/AppHead';
import ViewMode, { ViewOption } from '../control/ViewMode';
import { UnsavedContext } from '../context/UnsavedContext';
import SplitPane, { Pane } from 'react-split-pane';
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
import PassageChooser from '../components/PassageDetail/PassageChooser';
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
import { RoleNames, Plan, IToolStrings } from '../model';
import { forceLogin, LocalKey, localUserKey, NamedRegions } from '../utils';
import { memory } from '../schema';
import { useSelector, shallowEqual } from 'react-redux';
import { toolSelector } from '../selector';
import { QueryBuilder } from '@orbit/data';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
      width: `calc(100% - 32px)`,
    },
    panel2: {
      display: 'flex',
      flexDirection: 'row',
      paddingTop: `${HeadHeight}px`,
    },
    description: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    right: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    column: {
      alignItems: 'left',
      whiteSpace: 'nowrap',
    },
    row: {
      alignItems: 'center',
      whiteSpace: 'nowrap',
    },
    padRow: {
      paddingTop: '16px',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    pane: {},
    textarea: { resize: 'none' },
    actionButton: {
      color: theme.palette.primary.light,
    },
    transcriber: {
      padding: theme.spacing(2),
    },
  })
);
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
interface ParamTypes {
  prjId: string;
}

const PassageDetailGrids = () => {
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [plan] = useGlobal('plan');
  const [width, setWidth] = useState(window.innerWidth);
  const [topFilter, setTopFilter] = useState(false);
  const ctx = useContext(PassageDetailContext);
  const { currentstep, discussionSize, setDiscussionSize, orgWorkflowSteps } =
    ctx.state;
  const { tool, settings } = useStepTool(currentstep);
  const { slugFromId } = useArtifactType();

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

  const handleSplitSize = debounce((e: number) => {
    setDiscussionSize({ width: width - e, height: discussionSize.height });
  }, 50);

  const setDimensions = () => {
    setWidth(window.innerWidth);
    setDiscussionSize({
      width: discussionSize.width, //should we be smarter here?
      height: window.innerHeight - 330,
    });
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
    <div className={classes.panel2}>
      <Grid container direction="row" className={classes.row}>
        <Grid container direction="row" className={classes.row}>
          <Grid item className={classes.row} xs={6}>
            <PassageDetailSectionPassage />
          </Grid>
          <Grid item id="tool" className={classes.row} xs={3}>
            {tool && t.hasOwnProperty(tool) ? t.getString(tool) : tool}
          </Grid>
          {projRole === RoleNames.Admin && (
            <Grid item id="stepcomplete" className={classes.right} xs={3}>
              <PassageDetailStepComplete />
            </Grid>
          )}
        </Grid>
        <Grid item className={classes.description} xs={12}>
          <WorkflowSteps />
        </Grid>
        <Grid item xs={12}>
          <PassageChooser />
        </Grid>
        {tool === ToolSlug.Resource && (
          <Grid container direction="row" className={classes.row}>
            <Grid item xs={12}>
              <Grid container>
                <PassageDetailArtifacts />
              </Grid>
            </Grid>
          </Grid>
        )}
        {tool === ToolSlug.Paratext && (
          <IntegrationTab artifactType={artifactSlug} />
        )}
        {(tool === ToolSlug.Discuss ||
          tool === ToolSlug.TeamCheck ||
          tool === ToolSlug.Record ||
          tool === ToolSlug.Transcribe) && (
          <Paper className={classes.paper}>
            <Wrapper>
              <SplitPane
                defaultSize={width - discussionSize.width - 16}
                style={{ position: 'static' }}
                split="vertical"
                onChange={handleSplitSize}
              >
                <Pane className={classes.pane}>
                  {tool === ToolSlug.Record && (
                    <Grid item className={classes.description} xs={12}>
                      <PassageDetailRecord />
                    </Grid>
                  )}
                  {tool !== ToolSlug.Record && tool !== ToolSlug.Transcribe && (
                    <Grid item className={classes.description} xs={12}>
                      <PassageDetailPlayer />
                    </Grid>
                  )}
                  {tool === ToolSlug.TeamCheck && (
                    <Grid item className={classes.description} xs={12}>
                      <TeamCheckReference />
                    </Grid>
                  )}
                  {tool === ToolSlug.Transcribe && (
                    <Grid item className={classes.description} xs={12}>
                      <PassageDetailTranscribe
                        width={width - discussionSize.width - 16}
                        artifactTypeId={artifactId}
                        onFilter={handleFilter}
                      />
                    </Grid>
                  )}
                </Pane>
                {!topFilter && (
                  <Pane className={classes.pane}>
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
          <Grid container direction="row" className={classes.row}>
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
    </div>
  );
};

export const PassageDetail = () => {
  const classes = useStyles();
  const { prjId } = useParams<ParamTypes>();
  const { pathname } = useLocation();
  const setUrlContext = useUrlContext();
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = uctx.state;
  const [view, setView] = useState('');
  const [projRole] = useGlobal('projRole');
  const { setMyProjRole } = useRole();
  const [projType] = useGlobal('projType');
  const { setProjectType } = useProjectType();

  const handleSwitchTo = () => {
    setView(`/plan/${prjId}/0`);
  };

  const SwitchTo = () => {
    return (
      <ViewMode
        mode={ViewOption.Detail}
        onMode={(mode: ViewOption) =>
          mode === ViewOption.AudioProject && checkSavedFn(handleSwitchTo)
        }
      />
    );
  };

  useEffect(() => {
    const projectId = setUrlContext(prjId);
    if (!projRole)
      if (!setMyProjRole(projectId)) {
        // If after proj role set there is none, force reload
        localStorage.removeItem(localUserKey(LocalKey.url));
        forceLogin();
        setView('/logout');
      }
    if (projType === '') setProjectType(projectId);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (view !== '' && view !== pathname) return <StickyRedirect to={view} />;

  return (
    <div className={classes.root}>
      <AppHead SwitchTo={SwitchTo} />
      <PassageDetailProvider>
        <PassageDetailGrids />
      </PassageDetailProvider>
    </div>
  );
};
export default PassageDetail;
