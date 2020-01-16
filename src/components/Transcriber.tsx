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
  Passage,
  PassageStateChange,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  makeStyles,
  createStyles,
  Theme,
  useTheme,
} from '@material-ui/core/styles';
import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  TextareaAutosize,
  Tooltip,
  Checkbox,
  FormControlLabel,
  TextField,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
// import GearIcon from '@material-ui/icons/SettingsApplications';
import SkipBackIcon from '@material-ui/icons/FastRewind';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipAheadIcon from '@material-ui/icons/FastForward';
import HistoryIcon from '@material-ui/icons/History';
import { FaAngleDoubleUp, FaAngleDoubleDown } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import Duration from './Duration';
import SnackBar from './SnackBar';
import {
  sectionDescription,
  passageDescription,
  relMouseCoords,
  related,
} from '../utils';
import Auth from '../auth/Auth';
import { debounce } from 'lodash';
import { DrawerTask } from '../routes/drawer';
import { TaskItemWidth } from '../components/TaskTable';
import keycode from 'keycode';
import moment from 'moment';

const MIN_SPEED = 0.5;
const MAX_SPEED = 2.0;
const SPEED_STEP = 0.1;
const PLAY_PAUSE_KEY = 'ESC';
const BACK_KEY = 'F2';
const AHEAD_KEY = 'F3';
const SLOWER_KEY = 'F4';
const FASTER_KEY = 'F5';
const HISTORY_KEY = 'F6';
const NON_BOX_HEIGHT = 304;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
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
    padRow: {
      paddingTop: '16px',
    },
    comment: {
      paddingTop: '16px',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
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
  const theme = useTheme();
  const [lang] = useGlobal('lang');
  const [memory] = useGlobal('memory');
  const [project] = useGlobal('project');
  const [projRec, setProjRec] = React.useState<Project>();
  const [passRec, setPassRec] = React.useState<Passage>(passage);
  const [passageStateChanges, setPassageStateChanges] = React.useState<
    PassageStateChange[]
  >([]);
  const [playing, setPlaying] = React.useState(false);
  const [playSpeed, setPlaySpeed] = React.useState(1);
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
  const [boxHeight, setBoxHeight] = React.useState(height - NON_BOX_HEIGHT);
  const [defaultValue, setDefaultValue] = React.useState('');
  const [defaultPosition, setDefaultPosition] = React.useState(0.0);
  const [message, setMessage] = React.useState(<></>);
  const [makeComment, setMakeComment] = React.useState(false);
  const [comment, setComment] = React.useState('');
  const [showHistory, setShowHistory] = React.useState(false);
  const playerRef = React.useRef<any>();
  const progressRef = React.useRef<any>();
  const transcriptionRef = React.useRef<any>();
  const commentRef = React.useRef<any>();

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
      const { x } = relMouseCoords(e, progressRef.current);
      playerRef.current.seekTo(x / clientWidth);
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
  const handleJumpEv = (amount: number) => () => handleJumpFn(amount);
  const rnd1 = (val: number) => Math.round(val * 10) / 10;
  const handleSlower = () => {
    if (playSpeed > MIN_SPEED) setPlaySpeed(rnd1(playSpeed - SPEED_STEP));
  };
  const handleFaster = () => {
    if (playSpeed < MAX_SPEED) setPlaySpeed(rnd1(playSpeed + SPEED_STEP));
  };
  const handleMakeComment = () => setMakeComment(!makeComment);
  const handleCommentChange = (e: any) => {
    setComment(e.target.value);
  };
  const handleShowHistory = () => setShowHistory(!showHistory);
  const handleReject = (transcribing: boolean) => async () => {
    const newState = transcribing
      ? ActivityStates.NeedsNewRecording
      : ActivityStates.NeedsNewTranscription;
    await memory.update((t: TransformBuilder) => [
      t.replaceAttribute(passRec, 'lastComment', comment),
      t.replaceAttribute(passRec, 'state', newState),
    ]);
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
          t.replaceAttribute(passRec, 'lastComment', comment),
          t.replaceAttribute(passRec, 'state', next[state]),
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
      memory.update((t: TransformBuilder) => [
        t.replaceAttribute(passRec, 'lastComment', comment),
        t.updateRecord({
          type: 'mediafile',
          id: mediaId,
          attributes: {
            transcription: transcription,
            position: playedSeconds,
          },
        }),
      ]);
    }
    done();
  };
  const handleClose = () => done();
  const previous: { [key: string]: string } = {
    transcribed: ActivityStates.TranscribeReady,
    transcribing: ActivityStates.TranscribeReady,
    reviewing: ActivityStates.TranscribeReady,
    approved: ActivityStates.TranscribeReady,
  };
  const handleReopen = async () => {
    if (previous.hasOwnProperty(state)) {
      await memory.update((t: TransformBuilder) => [
        t.replaceAttribute(passRec, 'lastComment', comment),
        t.replaceAttribute(passRec, 'state', previous[state]),
      ]);
    }
    done();
  };
  const handleKey = (e: React.KeyboardEvent) => {
    // setMessage(<span>{e.keyCode} pressed</span>);
    const PlayPauseKey = keycode(PLAY_PAUSE_KEY);
    const JumpBackKey = keycode(BACK_KEY);
    const JumpAheadKey = keycode(AHEAD_KEY);
    const SlowerKey = keycode(SLOWER_KEY);
    const FasterKey = keycode(FASTER_KEY);
    const HistoryKey = keycode(HISTORY_KEY);
    switch (e.keyCode) {
      case PlayPauseKey:
        setPlaying(!playing);
        e.preventDefault();
        return;
      case JumpBackKey:
        handleJumpFn(-1 * jump);
        e.preventDefault();
        return;
      case JumpAheadKey:
        handleJumpFn(jump);
        e.preventDefault();
        return;
      case SlowerKey:
        handleSlower();
        e.preventDefault();
        return;
      case FasterKey:
        handleFaster();
        e.preventDefault();
        return;
      case HistoryKey:
        handleShowHistory();
        e.preventDefault();
        return;
    }
  };
  const handleMessageReset = () => setMessage(<></>);

  const setDimensions = () => {
    setHeight(window.innerHeight);
    setWidth(window.innerWidth - theme.spacing(DrawerTask) - TaskItemWidth);
  };

  React.useEffect(() => {
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

  React.useEffect(() => {
    const loadStateChange = async () => {
      const recs = (await memory.query((q: QueryBuilder) =>
        q.findRecords('passagestatechange')
      )) as PassageStateChange[];
      if (recs) {
        const curStateChanges = recs.filter(
          r => related(r, 'passage') === passage.id
        );
        setPassageStateChanges(curStateChanges);
      }
    };
    loadStateChange();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [passage]);

  React.useEffect(() => {
    const commentHeight =
      commentRef && commentRef.current ? commentRef.current.clientHeight : 0;
    const newBoxHeight = height - NON_BOX_HEIGHT - commentHeight;
    if (newBoxHeight !== boxHeight) setBoxHeight(newBoxHeight);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [height, makeComment, comment, commentRef.current]);

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
    setPassRec(
      memory.cache.query((q: QueryBuilder) => q.findRecord(passage)) as Passage
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [passage]);

  React.useEffect(() => {
    if (passRec && passRec.attributes && passRec.attributes.lastComment) {
      setComment(passRec.attributes.lastComment);
    } else setComment('');
  }, [passRec]);

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

  moment.locale(lang);

  return (
    <div className={classes.root}>
      <Paper
        className={classes.paper}
        onKeyDown={handleKey}
        style={{ width: width - 24 }}
      >
        <Grid container direction="column">
          <Grid container direction="row" className={classes.row}>
            <Grid
              item
              xs={9}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {sectionDescription(section)}
            </Grid>
            <Grid item>{passageDescription(passRec)}</Grid>
          </Grid>
          <Grid container direction="row" className={classes.row}>
            <Grid item>
              <Typography>
                <Duration seconds={playedSeconds} /> {' / '}
                <Duration seconds={totalSeconds} />
              </Typography>
            </Grid>
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
          </Grid>
          <Grid container direction="row" className={classes.row}>
            <Grid container xs justify="center">
              <Tooltip title={t.backTip.replace('{0}', BACK_KEY)}>
                <IconButton onClick={handleJumpEv(-1 * jump)}>
                  <>
                    <SkipBackIcon /> <Typography>{BACK_KEY}</Typography>
                  </>
                </IconButton>
              </Tooltip>
              <Tooltip
                title={(playing ? t.playTip : t.pauseTip).replace(
                  '{0}',
                  PLAY_PAUSE_KEY
                )}
              >
                <IconButton onClick={handlePlayStatus(!playing)}>
                  <>
                    {playing ? <PauseIcon /> : <PlayIcon />}{' '}
                    <Typography>{PLAY_PAUSE_KEY}</Typography>
                  </>
                </IconButton>
              </Tooltip>
              <Tooltip title={t.aheadTip.replace('{0}', AHEAD_KEY)}>
                <IconButton onClick={handleJumpEv(jump)}>
                  <>
                    <SkipAheadIcon /> <Typography>{AHEAD_KEY}</Typography>
                  </>
                </IconButton>
              </Tooltip>
              <Tooltip title={t.slowerTip.replace('{0}', SLOWER_KEY)}>
                <IconButton onClick={handleSlower}>
                  <>
                    <FaAngleDoubleDown /> <Typography>{SLOWER_KEY}</Typography>
                  </>
                </IconButton>
              </Tooltip>
              <Tooltip title={t.fasterTip.replace('{0}', FASTER_KEY)}>
                <IconButton onClick={handleFaster}>
                  <>
                    <FaAngleDoubleUp /> <Typography>{FASTER_KEY}</Typography>
                  </>
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title={t.historyTip.replace('{0}', HISTORY_KEY)}>
                <IconButton
                  onClick={handleShowHistory}
                  disabled={passageStateChanges.length === 0}
                >
                  <>
                    <HistoryIcon /> <Typography>{HISTORY_KEY}</Typography>
                  </>
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <Grid item xs={12} sm container>
            <Grid
              ref={transcriptionRef}
              item
              xs={showHistory ? 6 : 12}
              container
              direction="column"
            >
              <WebFontLoader config={fontConfig}>
                <TextareaAutosize
                  defaultValue={defaultValue}
                  readOnly={role !== 'transcriber'}
                  style={{
                    overflow: 'auto',
                    backgroundColor: '#cfe8fc',
                    height: boxHeight,
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
            {showHistory && (
              <Grid item xs={6} container direction="column">
                <List style={{ overflow: 'auto', height: boxHeight }}>
                  {passageStateChanges
                    .sort((i, j) =>
                      i.attributes.dateCreated < j.attributes.dateCreated
                        ? -1
                        : 1
                    )
                    .map(psc => (
                      <ListItem>
                        <ListItemText
                          primary={
                            moment(psc.attributes.dateCreated).calendar() +
                            ' - ' +
                            psc.attributes.state
                          }
                          secondary={psc.attributes.comments}
                        />
                      </ListItem>
                    ))}
                </List>
              </Grid>
            )}
          </Grid>
          <Grid container direction="row">
            {makeComment && (
              <TextField
                ref={commentRef}
                label={t.comment}
                variant="filled"
                multiline
                rowsMax={5}
                className={classes.comment}
                value={comment}
                onChange={handleCommentChange}
                style={{ overflow: 'auto' }}
              />
            )}
          </Grid>
          <Grid container direction="row" className={classes.padRow}>
            <Grid item>
              <FormControlLabel
                control={
                  <Checkbox
                    value={makeComment}
                    onChange={handleMakeComment}
                    color="primary"
                  />
                }
                label={t.makeComment}
              />
            </Grid>
            <Grid container xs justify="flex-end">
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
                      onClick={handleReject(transcribing)}
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
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    className={classes.button}
                    onClick={handleReopen}
                    disabled={!previous.hasOwnProperty(state)}
                  >
                    {t.reopen}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleClose}
                  >
                    {t.close}
                  </Button>
                </>
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
