import React, { useEffect, useState, useContext } from 'react';
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
import Auth from '../auth/Auth';
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
// import PassageDetailToolbar from '../components/PassageDetail/PassageDetailToolbar';
import PassageDetailArtifacts from '../components/PassageDetail/Internalization/PassageDetailArtifacts';
import TeamCheckReference from '../components/PassageDetail/TeamCheckReference';
import PassageDetailPlayer from '../components/PassageDetail/PassageDetailPlayer';
import PassageDetailRecord from '../components/PassageDetail/PassageDetailRecord';
import PassageBackTranslate from '../components/PassageDetail/PassageBackTranslate';
import { useStepId } from '../crud';

const INIT_COMMENT_WIDTH = 500;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
      width: '100%',
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
      justifyContent: 'end',
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
interface IProps {
  auth: Auth;
}
interface ParamTypes {
  prjId: string;
}

const PassageDetailGrids = (props: IProps) => {
  const { auth } = props;
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [width, setWidth] = useState(window.innerWidth);
  const ctx = useContext(PassageDetailContext);
  const { currentstep } = ctx.state;
  const internalizationRec = useStepId('Internalization');
  const teamCheckRec = useStepId('TeamCheck');
  const recordRec = useStepId('Record');
  const backTranslationRec = useStepId('BackTranslation');
  const [playerWidth, setPlayerWidth] = useState(width - INIT_COMMENT_WIDTH);

  const handleSplitSize = debounce((e: number) => {
    setPlayerWidth(e);
  }, 50);

  const setDimensions = () => {
    setWidth(window.innerWidth);
    // setPaperStyle({ width: window.innerWidth - 10 });
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

  return (
    <div className={classes.panel2}>
      <Grid container direction="row" className={classes.row}>
        <Grid item className={classes.description} xs={12}>
          <WorkflowSteps />
        </Grid>
        <Grid container direction="row" className={classes.row}>
          <Grid item className={classes.row} xs={9}>
            <PassageDetailSectionPassage />
          </Grid>
          {/admin/i.test(projRole) && (
            <Grid item className={classes.right} xs={3}>
              <PassageDetailStepComplete />
            </Grid>
          )}
        </Grid>
        {currentstep === internalizationRec?.id && (
          <Grid container direction="row" className={classes.row}>
            {/* <Grid item xs={12}>
                <PassageDetailToolbar />
              </Grid> */}
            <Grid item xs={12}>
              <Grid container>
                <PassageDetailArtifacts auth={auth} />
              </Grid>
            </Grid>
          </Grid>
        )}
        {currentstep === recordRec?.id && (
          <Grid container direction="row" className={classes.row}>
            <Grid item xs={12}>
              <PassageDetailRecord width={width - 20} />
            </Grid>
          </Grid>
        )}
        {currentstep === backTranslationRec?.id && (
          <Grid container direction="row" className={classes.row}>
            <Grid item xs={12}>
              <PassageBackTranslate width={width - 20} />
            </Grid>
          </Grid>
        )}
        {currentstep !== internalizationRec?.id &&
          currentstep !== recordRec?.id &&
          currentstep !== backTranslationRec?.id && (
            <>
              <Paper className={classes.paper}>
                <Wrapper>
                  <SplitPane
                    defaultSize={width - INIT_COMMENT_WIDTH}
                    style={{ position: 'static' }}
                    split="vertical"
                    onChange={handleSplitSize}
                  >
                    <Pane className={classes.pane}>
                      {currentstep === teamCheckRec?.id && (
                        <Grid item className={classes.description} xs={12}>
                          <TeamCheckReference width={playerWidth} />
                        </Grid>
                      )}
                      <Grid item className={classes.description} xs={12}>
                        <PassageDetailPlayer />
                      </Grid>
                    </Pane>
                    <Pane className={classes.pane}>
                      <Grid item xs={12} sm container>
                        <Grid item container direction="column">
                          <DiscussionList />
                        </Grid>
                      </Grid>
                    </Pane>
                  </SplitPane>
                </Wrapper>
              </Paper>
            </>
          )}
      </Grid>
    </div>
  );
};

export const PassageDetail = (props: IProps) => {
  const classes = useStyles();
  const { prjId } = useParams<ParamTypes>();
  const { pathname } = useLocation();
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = uctx.state;
  const [view, setView] = useState('');

  const handleSwitchTo = () => {
    setView(`/plan/${prjId}/0`);
  };

  const SwitchTo = () => {
    //if (projRole !== 'admin') return <></>;
    return (
      <ViewMode
        mode={ViewOption.Detail}
        onMode={(mode: ViewOption) =>
          mode === ViewOption.AudioProject && checkSavedFn(handleSwitchTo)
        }
      />
    );
  };

  if (view !== '' && view !== pathname) return <StickyRedirect to={view} />;

  return (
    <div className={classes.root}>
      <AppHead {...props} SwitchTo={SwitchTo} />
      <PassageDetailProvider {...props}>
        <PassageDetailGrids {...props} />
      </PassageDetailProvider>
    </div>
  );
};

export default PassageDetail;
