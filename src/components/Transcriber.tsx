import React from 'react';
import { useGlobal } from 'reactn';
import WebFontLoader from '@dr-kobros/react-webfont-loader';
import {
  MediaFile,
  Project,
  ActivityStates,
  Passage,
  PassageStateChange,
  Section,
  Plan,
  PlanType,
  User,
} from '../model';
import { QueryBuilder, TransformBuilder, Operation } from '@orbit/data';
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
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import useTodo from '../context/useTodo';
import SkipBackIcon from '@material-ui/icons/FastRewind';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipAheadIcon from '@material-ui/icons/FastForward';
import HistoryIcon from '@material-ui/icons/History';
import TimerIcon from '@material-ui/icons/AccessTime';
import { FaAngleDoubleUp, FaAngleDoubleDown } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import Duration, { formatTime } from './Duration';
import UserAvatar from './UserAvatar';
import TranscribeReject from './TranscribeReject';
import SnackBar from './SnackBar';
import {
  sectionDescription,
  passageDescription,
  relMouseCoords,
  related,
  insertAtCursor,
  remoteIdGuid,
  remoteIdNum,
  FontData,
  getFontData,
} from '../utils';
import Auth from '../auth/Auth';
import { debounce } from 'lodash';
import { DrawerTask } from '../routes/drawer';
import { TaskItemWidth } from '../components/TaskTable';
import keycode from 'keycode';
import moment from 'moment-timezone';
import { UpdateRecord } from '../model/baseModel';
import {
  UpdatePassageStateOps,
  AddPassageStateCommentOps,
} from '../utils/UpdatePassageState';
import { logError, Severity } from '../components/logErrorService';

const MIN_SPEED = 0.5;
const MAX_SPEED = 2.0;
const SPEED_STEP = 0.1;
const PLAY_PAUSE_KEY = 'ESC';
const BACK_KEY = 'F2';
const AHEAD_KEY = 'F3';
const SLOWER_KEY = 'F4';
const FASTER_KEY = 'F5';
const HISTORY_KEY = 'F6';
const TIMER_KEY = 'F7';
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
    description: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
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
      overflow: 'auto',
    },
    history: {
      overflow: 'auto',
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

interface IProps {
  auth: Auth;
}

export function Transcriber(props: IProps) {
  const { auth } = props;
  const {
    rowData,
    index,
    transcriberStr,
    mediaUrl,
    fetchMediaUrl,
    allBookData,
    selected,
  } = useTodo();
  const {
    section,
    passage,
    duration,
    mediaRemoteId,
    mediaId,
    state,
    role,
  } = rowData[index] || {
    section: {} as Section,
    passage: {} as Passage,
    duration: 0,
    mediaRemoteId: '',
    mediaId: '',
    state: '',
    role: '',
  };
  const classes = useStyles();
  const theme = useTheme();
  const [keyMap] = useGlobal('keyMap');
  const [lang] = useGlobal('lang');
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [project] = useGlobal('project');
  const [user] = useGlobal('user');
  const [errorReporter] = useGlobal('errorReporter');
  const [busy] = useGlobal('remoteBusy');
  const [assigned, setAssigned] = React.useState('');
  const [changed, setChanged] = useGlobal('changed');
  const [doSave, setDoSave] = useGlobal('doSave');
  const [projData, setProjData] = React.useState<FontData>();
  const [fontStatus, setFontStatus] = React.useState<string>();
  const [playing, setPlaying] = React.useState(false);
  const [playSpeed, setPlaySpeed] = React.useState(1);
  // playedSeconds is needed to update progress bar
  const [playedSeconds, setPlayedSeconds] = React.useState(0);
  // playedSecsRef is needed for autosave
  const playedSecsRef = React.useRef<number>(0);
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
  const [textValue, setTextValue] = React.useState('');
  const [defaultPosition, setDefaultPosition] = React.useState(0.0);
  const [message, setMessage] = React.useState(<></>);
  const [makeComment, setMakeComment] = React.useState(false);
  const [comment, setComment] = React.useState('');
  const [showHistory, setShowHistory] = React.useState(false);
  const [historyContent, setHistoryContent] = React.useState<any[]>();
  const [rejectVisible, setRejectVisible] = React.useState(false);
  const [transcriptionIn, setTranscriptionIn] = React.useState('');
  const playerRef = React.useRef<any>();
  const progressRef = React.useRef<any>();
  const transcriptionRef = React.useRef<any>();
  const commentRef = React.useRef<any>();
  const autosaveTimer = React.useRef<NodeJS.Timeout>();
  const t = transcriberStr;

  const handleChange = (e: any) => {
    setTextValue(e.target.value);
    if (!changed) setChanged(true);
  };
  const handlePlayStatus = (status: boolean) => () => setPlaying(status);
  const loadStatus = (status: string) => {
    // console.log('Font status: current=', fontStatus, ' new=', status);
    setFontStatus(status);
  };
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
      playedSecsRef.current = ctrl.playedSeconds;
    }
  };
  const handleMouseDown = () => {
    setSeeking(true);
  };
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
  const handleTimer = () => {
    if (transcriptionRef.current) {
      transcriptionRef.current.firstChild.focus();
      const timeStamp = '(' + formatTime(playedSeconds) + ')';
      const textArea = transcriptionRef.current
        .firstChild as HTMLTextAreaElement;
      insertAtCursor(textArea, timeStamp);
    }
  };
  const handleReject = () => {
    setMakeComment(true);
    setRejectVisible(true);
  };
  const handleRejected = async (pass: Passage) => {
    setRejectVisible(false);
    await memory.update(
      UpdatePassageStateOps(
        pass.id,
        pass.attributes.state,
        pass.attributes.lastComment,
        remoteIdNum('user', user, memory.keyMap),
        new TransformBuilder(),
        []
      )
    );
    pass.attributes.lastComment = '';
  };
  const handleRejectCancel = () => setRejectVisible(false);

  const next: { [key: string]: string } = {
    incomplete: ActivityStates.Transcribed,
    transcribing: ActivityStates.Transcribed,
    reviewing: ActivityStates.Approved,
    transcribeReady: ActivityStates.Transcribed,
    transcribed: ActivityStates.Approved,
    needsNewTranscription: ActivityStates.Transcribed,
  };
  const getType = () => {
    const sectionId = related(passage, 'section');
    if (!sectionId) return null;
    const secRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'section', id: sectionId })
    ) as Section;
    const planId = related(secRec, 'plan');
    if (!planId) return null;
    const planRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'plan', id: planId })
    ) as Plan;
    const planTypeId = related(planRec, 'plantype');
    if (!planTypeId) return null;
    const planTypeRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'plantype', id: planTypeId })
    ) as PlanType;
    const planType =
      planTypeRec &&
      planTypeRec.attributes &&
      planTypeRec.attributes.name &&
      planTypeRec.attributes.name.toLowerCase();
    return planType;
  };
  const handleSubmit = async () => {
    if (transcriptionRef.current) {
      if (next.hasOwnProperty(state)) {
        const transcription = transcriptionRef.current.firstChild.value;
        let nextState = next[state];
        if (nextState === ActivityStates.Approved && getType() !== 'scripture')
          nextState = ActivityStates.Done;
        var tb = new TransformBuilder();
        var ops = UpdatePassageStateOps(
          passage.id,
          nextState,
          comment,
          remoteIdNum('user', user, memory.keyMap),
          tb,
          []
        );
        ops.push(
          UpdateRecord(
            tb,
            {
              type: 'mediafile',
              id: mediaId,
              attributes: {
                transcription: transcription,
                position: 0,
              },
            } as MediaFile,
            remoteIdNum('user', user, keyMap)
          )
        );
        await memory.update(ops);
        setComment('');
        loadHistory();
        setChanged(false);
      } else {
        logError(Severity.error, errorReporter, `Unhandled state: ${state}`);
      }
    }
  };

  const nextOnSave: { [key: string]: string } = {
    incomplete: ActivityStates.Transcribing,
    needsNewTranscription: ActivityStates.Transcribing,
    transcribeReady: ActivityStates.Transcribing,
    transcribed: ActivityStates.Reviewing,
  };

  const handleSaveButton = () => handleSave(true);

  const handleSave = async (postComment: boolean = false) => {
    if (transcriptionRef.current) {
      let transcription = transcriptionRef.current.firstChild.value;
      const userid = remoteIdNum('user', user, keyMap);
      const tb = new TransformBuilder();
      let ops: Operation[] = [];
      if (nextOnSave[state] !== undefined)
        ops = UpdatePassageStateOps(
          passage.id,
          nextOnSave[state],
          '',
          userid,
          tb,
          ops
        );
      if (postComment && comment !== '') {
        ops = AddPassageStateCommentOps(
          passage.id,
          state,
          comment,
          userid,
          tb,
          ops
        );
      }
      ops.push(
        UpdateRecord(
          tb,
          {
            type: 'mediafile',
            id: mediaId,
            attributes: {
              transcription: transcription,
              position: playedSecsRef.current,
            },
          } as MediaFile,
          userid
        )
      );
      await memory.update(ops);
      if (postComment) setComment('');
      loadHistory();
      setChanged(false);
    }
  };
  const previous: { [key: string]: string } = {
    incomplete: ActivityStates.TranscribeReady,
    transcribed: ActivityStates.TranscribeReady,
    transcribing: ActivityStates.TranscribeReady,
    reviewing: ActivityStates.TranscribeReady,
    approved: ActivityStates.TranscribeReady,
    done: ActivityStates.TranscribeReady,
  };
  const handleReopen = async () => {
    if (previous.hasOwnProperty(state)) {
      await memory.update(
        UpdatePassageStateOps(
          passage.id,
          previous[state],
          comment,
          remoteIdNum('user', user, keyMap),
          new TransformBuilder(),
          []
        )
      );
    }
  };
  const handleKey = (e: React.KeyboardEvent) => {
    // setMessage(<span>{e.keyCode} pressed</span>);
    const PlayPauseKey = keycode(PLAY_PAUSE_KEY);
    const JumpBackKey = keycode(BACK_KEY);
    const JumpAheadKey = keycode(AHEAD_KEY);
    const SlowerKey = keycode(SLOWER_KEY);
    const FasterKey = keycode(FASTER_KEY);
    const HistoryKey = keycode(HISTORY_KEY);
    const TimerKey = keycode(TIMER_KEY);
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
      case TimerKey:
        handleTimer();
        e.preventDefault();
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
    if (doSave) {
      handleSave();
      setDoSave(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [doSave]);

  React.useEffect(() => {
    const commentHeight =
      commentRef && commentRef.current ? commentRef.current.clientHeight : 0;
    const newBoxHeight = height - NON_BOX_HEIGHT - commentHeight;
    if (newBoxHeight !== boxHeight) setBoxHeight(newBoxHeight);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [height, makeComment, comment, commentRef.current]);

  React.useEffect(() => {
    const mediafiles = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('mediafile')
    ) as MediaFile[];
    const mediaRec = mediafiles.filter((m) => m.id === mediaId);
    if (mediaRec.length > 0 && mediaRec[0] && mediaRec[0].attributes) {
      const attr = mediaRec[0].attributes;
      const transcription = attr.transcription ? attr.transcription : '';
      setTranscriptionIn(transcription);
      setTextValue(transcription);
      setDefaultPosition(attr.position);
      setPlaying(false);
      //focus on player
      if (transcriptionRef.current) transcriptionRef.current.firstChild.focus();
    }
    if (passage && passage.attributes && passage.attributes.lastComment) {
      setComment(passage.attributes.lastComment);
    } else setComment('');
    setTotalSeconds(duration);
    if (mediaRemoteId && mediaRemoteId !== '') {
      fetchMediaUrl(mediaRemoteId, memory, offline, auth);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [index, selected]);

  React.useEffect(() => {
    if (project && project !== '') {
      memory
        .query((q) => q.findRecord({ type: 'project', id: project }))
        .then((r: Project) => {
          setProjData(getFontData(r, offline));
        });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  const handleAutosave = () => {
    const transcription = transcriptionRef.current.firstChild.value;
    if (transcriptionIn !== transcription) {
      if (!busy) {
        handleSave().finally(() => {
          setTranscriptionIn(transcription);
          launchTimer();
        });
      }
      return;
    }
    launchTimer();
  };

  const launchTimer = () => {
    autosaveTimer.current = setTimeout(() => {
      handleAutosave();
    }, 1000 * 30);
  };

  React.useEffect(() => {
    if (autosaveTimer.current === undefined) {
      launchTimer();
    } else {
      clearTimeout(autosaveTimer.current);
      launchTimer();
    }
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = undefined;
      }
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [transcriptionIn, mediaId]);

  const textAreaStyle = {
    overflow: 'auto',
    backgroundColor: '#cfe8fc',
    height: boxHeight,
    width: '98hu',
    fontFamily: projData?.fontFamily,
    fontSize: projData?.fontSize,
    direction: projData?.fontDir as any,
  };

  const paperStyle = { width: width - 24 };
  const historyStyle = { height: boxHeight };

  moment.locale(lang);
  const curZone = moment.tz.guess();
  const userFromId = (remoteId: number) => {
    const id = remoteIdGuid('user', remoteId.toString(), keyMap);
    const user = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'user', id })
    ) as User;
    return user;
  };
  const nameFromId = (remoteId: number) => {
    const user = userFromId(remoteId);
    return user ? user.attributes.name : '';
  };
  const historyItem = (
    psc: PassageStateChange,
    comment: JSX.Element | string
  ) => {
    return (
      <ListItem>
        <ListItemIcon>
          <UserAvatar
            {...props}
            userRec={userFromId(psc.attributes.lastModifiedBy)}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <>
              <Typography variant="h6" component="span">
                {nameFromId(psc.attributes.lastModifiedBy)}
              </Typography>
              {'\u00A0\u00A0 '}
              <Typography component="span">
                {moment
                  .tz(moment.tz(psc.attributes.dateCreated, 'utc'), curZone)
                  .calendar()}
              </Typography>
            </>
          }
          secondary={comment}
        />
      </ListItem>
    );
  };

  const historyList = (passageStateChanges: PassageStateChange[]) => {
    const results: Array<JSX.Element> = [];
    let curState: ActivityStates;
    let curComment = '';
    passageStateChanges
      .sort((i, j) =>
        i.attributes.dateCreated < j.attributes.dateCreated ? -1 : 1
      )
      .forEach((psc) => {
        if (psc.attributes.state !== curState) {
          curState = psc.attributes.state;
          results.push(historyItem(psc, t.getString(curState)));
        }
        const comment = psc.attributes.comments;
        if (comment && comment !== '' && comment !== curComment) {
          curComment = comment;
          results.push(
            historyItem(psc, <span style={{ color: 'black' }}>{comment}</span>)
          );
        }
      });
    return results;
  };

  const loadHistory = async () => {
    const recs = (await memory.query((q: QueryBuilder) =>
      q.findRecords('passagestatechange')
    )) as PassageStateChange[];
    if (recs && passage?.id) {
      const curStateChanges = recs.filter(
        (r) => related(r, 'passage') === passage.id
      );
      setHistoryContent(historyList(curStateChanges));
    }
  };

  React.useEffect(() => {
    if (passage?.id) {
      loadHistory();
    }
    const newAssigned = rowData[index]?.assigned;
    if (newAssigned !== assigned) setAssigned(newAssigned);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [index, rowData]);

  return (
    <div className={classes.root}>
      <Paper className={classes.paper} onKeyDown={handleKey} style={paperStyle}>
        <Grid container direction="column">
          <Grid container direction="row" className={classes.row}>
            <Grid item xs={9} className={classes.description}>
              {sectionDescription(section)}
            </Grid>
            <Grid item>{passageDescription(passage, allBookData)}</Grid>
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
            <Grid item xs>
              <Grid container justify="center">
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
                      <FaAngleDoubleDown />{' '}
                      <Typography>{SLOWER_KEY}</Typography>
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
            </Grid>
            <Grid item>
              <Tooltip title={t.historyTip.replace('{0}', HISTORY_KEY)}>
                <span>
                  <IconButton
                    onClick={handleShowHistory}
                    disabled={historyContent === undefined}
                  >
                    <>
                      <HistoryIcon /> <Typography>{HISTORY_KEY}</Typography>
                    </>
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={t.timerTip.replace('{0}', TIMER_KEY)}>
                <span>
                  <IconButton
                    onClick={handleTimer}
                    disabled={role === 'view' || assigned !== user || playing}
                  >
                    <>
                      <TimerIcon /> <Typography>{TIMER_KEY}</Typography>
                    </>
                  </IconButton>
                </span>
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
              {projData && !fontStatus?.endsWith('active') ? (
                <WebFontLoader
                  config={projData.fontConfig}
                  onStatus={loadStatus}
                >
                  <TextareaAutosize
                    value={textValue}
                    readOnly={role === 'view' || assigned !== user}
                    style={textAreaStyle}
                    onChange={handleChange}
                  />
                </WebFontLoader>
              ) : (
                <TextareaAutosize
                  value={textValue}
                  readOnly={role === 'view' || assigned !== user}
                  style={textAreaStyle}
                  onChange={handleChange}
                />
              )}
            </Grid>
            {showHistory && (
              <Grid item xs={6} container direction="column">
                <List style={historyStyle} className={classes.history}>
                  {historyContent}
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
            <Grid item xs>
              <Grid container justify="flex-end">
                {role !== 'view' && assigned === user ? (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      className={classes.button}
                      onClick={handleReject}
                      disabled={playing}
                    >
                      {t.reject}
                    </Button>
                    <Tooltip title={transcribing ? t.saveTip : t.saveReviewTip}>
                      <Button
                        variant="outlined"
                        color="primary"
                        className={classes.button}
                        onClick={handleSaveButton}
                        disabled={playing}
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
                        disabled={playing}
                      >
                        {t.submit}
                      </Button>
                    </Tooltip>{' '}
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    color="primary"
                    className={classes.button}
                    onClick={handleReopen}
                    disabled={!previous.hasOwnProperty(state) || playing}
                  >
                    {t.reopen}
                  </Button>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <TranscribeReject
          visible={rejectVisible}
          passageIn={passage}
          editMethod={handleRejected}
          cancelMethod={handleRejectCancel}
        />
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

export default Transcriber;
