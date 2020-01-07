import React from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import WebFontLoader from '@dr-kobros/react-webfont-loader';
import * as actions from '../store';
import {
  MediaDescription,
  MediaFile,
  Project,
  ITranscriberStrings,
  IState,
  ActivityStates,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  TextareaAutosize,
  Tooltip,
} from '@material-ui/core';
import GearIcon from '@material-ui/icons/SettingsApplications';
import SkipBackIcon from '@material-ui/icons/FastRewind';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipAheadIcon from '@material-ui/icons/FastForward';
import ReactPlayer from 'react-player';
import Duration from './Duration';
import SnackBar from './SnackBar';
import { sectionDescription, passageDescription } from '../utils';
import Auth from '../auth/Auth';
import { debounce } from 'lodash';
import { DrawerWidth } from '../routes/drawer';
import { TaskItemWidth } from '../components/TaskTable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
      maxWidth: '100vh',
    },
    progress: {
      flexGrow: 1,
      margin: theme.spacing(2),
      cursor: 'pointer',
    },
    row: {
      alignItems: 'center',
      whiteSpace: 'nowrap',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    player: {
      display: 'none',
    },
  })
);

interface IStateProps {
  t: ITranscriberStrings;
  hasUrl: boolean;
  mediaUrl: string;
}

interface IDispatchProps {
  fetchMediaUrl: typeof actions.fetchMediaUrl;
}

interface IRecordProps {
  mediafiles: Array<MediaFile>;
}

interface IProps
  extends MediaDescription,
    IStateProps,
    IDispatchProps,
    IRecordProps {
  auth: Auth;
  done: () => void;
}

export function Transcriber(props: IProps) {
  const {
    t,
    auth,
    section,
    passage,
    duration,
    mediaRemoteId,
    mediaId,
    state,
    role,
    mediafiles,
  } = props;
  const { mediaUrl, fetchMediaUrl, done } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [project] = useGlobal('project');
  const [projRec, setProjRec] = React.useState<Project>();
  const [playing, setPlaying] = React.useState(false);
  const [playSpeed] = React.useState(1);
  const [playedSeconds, setPlayedSeconds] = React.useState(0);
  const [totalSeconds, setTotalSeconds] = React.useState(duration);
  const [seeking, setSeeking] = React.useState(false);
  const [jump] = React.useState(2);
  const [transcribing] = React.useState(
    state === ActivityStates.Transcribing ||
      state === ActivityStates.TranscribeReady
  );
  const [height, setHeight] = React.useState(window.innerHeight);
  const [width, setWidth] = React.useState(window.innerWidth);
  const [defaultValue, setDefaultValue] = React.useState('');
  const [defaultPosition, setDefaultPosition] = React.useState(0.0);
  const [message, setMessage] = React.useState(<></>);
  const playerRef = React.useRef<any>();
  const progressRef = React.useRef<any>();
  const transcriptionRef = React.useRef<any>();

  const handlePlayStatus = (status: boolean) => () => setPlaying(status);
  const handleReady = () => {
    if (defaultPosition > 0) {
      playerRef.current.seekTo(defaultPosition);
      setDefaultPosition(0);
    }
  };
  const handleProgress = (ctrl: any) => {
    if (!seeking) {
      if (!totalSeconds || totalSeconds < ctrl.loadedSeconds) {
        setTotalSeconds(ctrl.loadedSeconds);
      } else {
        setTotalSeconds(duration);
      }
      setPlayedSeconds(ctrl.playedSeconds);
    }
  };
  const handleMouseDown = () => setSeeking(true);
  const handleMouseUp = (e: React.MouseEvent) => {
    setSeeking(false);
    if (progressRef.current && playerRef.current) {
      const clientWidth = progressRef.current.clientWidth;
      const offsetLeft = progressRef.current.offsetLeft;
      playerRef.current.seekTo((e.clientX - offsetLeft) / clientWidth);
    }
  };
  const handleJumpFn = (amount: number) => {
    if (!playerRef.current) return;
    if (amount > 0) {
      playerRef.current.seekTo(Math.min(playedSeconds + amount, totalSeconds));
    } else {
      playerRef.current.seekTo(Math.max(playedSeconds + amount, 0));
    }
  };
  const handleJump = (amount: number) => () => handleJumpFn(amount);
  const handleReject = async () => {
    const newState = transcribing
      ? ActivityStates.NeedsNewRecording
      : ActivityStates.NeedsNewTranscription;
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute({ type: 'passage', id: passage.id }, 'state', newState)
    );
    done();
  };
  const next: { [key: string]: string } = {
    transcribing: ActivityStates.Transcribed,
    reviewing: ActivityStates.Approved,
    transcribeReady: ActivityStates.Transcribed,
    transcribed: ActivityStates.Approved,
  };
  const handleSubmit = async () => {
    if (transcriptionRef.current) {
      let transcription = transcriptionRef.current.firstChild.value;
      if (next.hasOwnProperty(state)) {
        await memory.update((t: TransformBuilder) => [
          t.replaceAttribute(
            { type: 'passage', id: passage.id },
            'state',
            next[state]
          ),
          t.updateRecord({
            type: 'mediafile',
            id: mediaId,
            attributes: {
              transcription: transcription,
              position: 0,
            },
          }),
        ]);
      } else {
        console.log('Unhandled state', state);
      }
    }
    done();
  };
  const handleSave = async () => {
    if (transcriptionRef.current) {
      let transcription = transcriptionRef.current.firstChild.value;
      memory.update((t: TransformBuilder) =>
        t.updateRecord({
          type: 'mediafile',
          id: mediaId,
          attributes: {
            transcription: transcription,
            position: playedSeconds,
          },
        })
      );
    }
    done();
  };
  const handleClose = () => done();
  const handleKey = (e: any) => {
    // setMessage(<span>{e.keyCode} pressed</span>);
    const ESC = 27;
    const F2 = 113;
    const F4 = 115;
    if (e.keyCode === ESC) setPlaying(!playing);
    if (e.keyCode === F2) handleJumpFn(-1 * jump);
    if (e.keyCode === F4) handleJumpFn(jump);
  };
  const handleMessageReset = () => setMessage(<></>);

  React.useEffect(() => {
    const handleResize = debounce(() => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth - DrawerWidth - TaskItemWidth);
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    const mediaRec = mediafiles.filter(m => m.id === mediaId);
    if (mediaRec.length > 0 && mediaRec[0] && mediaRec[0].attributes) {
      const attr = mediaRec[0].attributes;
      setDefaultValue(attr.transcription ? attr.transcription : '');
      setDefaultPosition(attr.position);
      setPlaying(false);
      //focus on player
      if (transcriptionRef.current) transcriptionRef.current.firstChild.focus();
    }
  }, [mediaId, mediafiles]);

  React.useEffect(() => {
    fetchMediaUrl(mediaRemoteId, auth);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediaRemoteId]);

  React.useEffect(() => {
    memory
      .query(q => q.findRecord({ type: 'project', id: project }))
      .then(r => setProjRec(r));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  const fontFamily =
    projRec && projRec.attributes && projRec.attributes.defaultFont
      ? projRec.attributes.defaultFont.split(',')[0].replace(/ /g, '')
      : 'CharisSIL';

  // See: https://github.com/typekit/webfontloader#custom
  const fontConfig = {
    custom: {
      families: [fontFamily],
      urls: ['/fonts/' + fontFamily + '.css'],
    },
  };

  return (
    <div className={classes.root}>
      <Paper
        className={classes.paper}
        onKeyUp={handleKey}
        style={{ width: width }}
      >
        <Grid container direction="column">
          <Grid container xs={12} direction="row" className={classes.row}>
            <Grid
              item
              xs={9}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {sectionDescription(section)}
            </Grid>
            <Grid item>{passageDescription(passage)}</Grid>
          </Grid>
          <Grid container xs={12} direction="row" className={classes.row}>
            <Grid item xs>
              <div className={classes.progress}>
                <LinearProgress
                  ref={progressRef}
                  variant="determinate"
                  value={Math.min((playedSeconds * 100) / totalSeconds, 100)}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                />
              </div>
            </Grid>
            <Grid item>
              <Typography>
                <Duration seconds={playedSeconds} /> {' / '}
                <Duration seconds={totalSeconds} />
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12} sm container>
            <Grid ref={transcriptionRef} item xs container direction="column">
              <WebFontLoader config={fontConfig}>
                <TextareaAutosize
                  defaultValue={defaultValue}
                  readOnly={role !== 'transcriber'}
                  style={{
                    overflow: 'auto',
                    backgroundColor: '#cfe8fc',
                    height: height - 240,
                    width: '98hu',
                    fontFamily: fontFamily,
                    fontSize:
                      projRec &&
                      projRec.attributes &&
                      projRec.attributes.defaultFontSize
                        ? projRec.attributes.defaultFontSize
                        : 'large',
                    direction:
                      projRec && projRec.attributes && projRec.attributes.rtl
                        ? 'rtl'
                        : 'ltr',
                  }}
                />
              </WebFontLoader>
            </Grid>
          </Grid>
          <Grid container xs={12} direction="row" className={classes.row}>
            <Grid item>
              <Tooltip title={t.settingsTip}>
                <IconButton>
                  <GearIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid container xs justify="center">
              <Tooltip title={t.backTip}>
                <IconButton onClick={handleJump(-1 * jump)}>
                  <SkipBackIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={playing ? t.playTip : t.pauseTip}>
                <IconButton onClick={handlePlayStatus(!playing)}>
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={t.aheadTip}>
                <IconButton onClick={handleJump(jump)}>
                  <SkipAheadIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              {role !== 'view' ? (
                <>
                  <Tooltip
                    title={
                      transcribing
                        ? t.rejectTranscriptionTip
                        : t.rejectReviewTip
                    }
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      className={classes.button}
                      onClick={handleReject}
                    >
                      {t.reject}
                    </Button>
                  </Tooltip>
                  <Tooltip title={transcribing ? t.saveTip : t.saveReviewTip}>
                    <Button
                      variant="outlined"
                      color="primary"
                      className={classes.button}
                      onClick={handleSave}
                    >
                      {t.save}
                    </Button>
                  </Tooltip>
                  <Tooltip
                    title={
                      transcribing
                        ? t.submitTranscriptionTip
                        : t.submitReviewTip
                    }
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      className={classes.button}
                      onClick={handleSubmit}
                    >
                      {t.submit}
                    </Button>
                  </Tooltip>{' '}
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleClose}
                >
                  {t.close}
                </Button>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      <div className={classes.player}>
        <ReactPlayer
          ref={playerRef}
          url={mediaUrl}
          controls={true}
          onEnded={handlePlayStatus(false)}
          playbackRate={playSpeed}
          playing={playing}
          onProgress={handleProgress}
          onReady={handleReady}
        />
      </div>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcriber' }),
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
});
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchMediaUrl: actions.fetchMediaUrl,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Transcriber) as any
) as any;
