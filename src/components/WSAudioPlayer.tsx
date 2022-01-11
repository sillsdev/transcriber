import {
  makeStyles,
  withStyles,
  Theme,
  createStyles,
  Paper,
  IconButton,
  Typography,
  Slider,
  InputLabel,
  Divider,
  Input,
  Grid,
} from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  useContext,
} from 'react';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import ForwardIcon from '@material-ui/icons/Refresh';
import ReplayIcon from '@material-ui/icons/Replay';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import StopIcon from '@material-ui/icons/Stop';
import LoopIcon from '@material-ui/icons/Loop';
import DeleteIcon from '@material-ui/icons/Delete';
import SilenceIcon from '@material-ui/icons/SpaceBar';
import TimerIcon from '@material-ui/icons/AccessTime';
import NextSegmentIcon from '@material-ui/icons/ArrowRightAlt';
import UndoIcon from '@material-ui/icons/Undo';
import localStrings from '../selector/localize';
import { IState, IWsAudioPlayerStrings } from '../model';
import {
  FaHandScissors,
  FaAngleDoubleUp,
  FaAngleDoubleDown,
  FaDotCircle,
  FaStopCircle,
} from 'react-icons/fa';

import { MimeInfo, useMediaRecorder } from '../crud/useMediaRecorder';
import { useWaveSurfer } from '../crud/useWaveSurfer';
import { Duration, LightTooltip } from '../control';
import { connect } from 'react-redux';
import { useSnackBar } from '../hoc/SnackBar';
import { HotKeyContext } from '../context/HotKeyContext';
import WSAudioPlayerZoom from './WSAudioPlayerZoom';
import { IRegionChange, IRegionParams } from '../crud/useWavesurferRegions';
import WSAudioPlayerSegment from './WSAudioPlayerSegment';
import Confirm from './AlertDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    main: {
      display: 'flex',
      flexDirection: 'column',
      whiteSpace: 'nowrap',
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyItems: 'flex-start',
      display: 'flex',
    },
    labeledControl: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    slider: {
      width: '50px',
      display: 'flex',
    },
    record: {
      color: 'red',
    },
    togglebutton: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    formControl: {
      margin: theme.spacing(1),
      maxWidth: 50,
    },
    grow: {
      flexGrow: 1,
    },
    smallFont: {
      fontSize: 'small',
    },
    divider: {
      marginLeft: '5px',
      orientation: 'vertical', //this doesn't work - has to be below
    },
    duration: {
      margin: '5px',
    },
    flipIcon: {
      transform: 'rotate(180deg)',
    },
  })
);

const iOSBoxShadow =
  '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';

const IOSSlider = withStyles({
  root: {
    width: '50px',
    color: '#3880ff',
    height: 2,
    padding: '15px 0',
  },
  thumb: {
    height: 10,
    width: 10,
    boxShadow: iOSBoxShadow,
    '&:focus, &:hover, &$active': {
      boxShadow: iOSBoxShadow,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        boxShadow: iOSBoxShadow,
      },
    },
  },
  active: {},
  valueLabel: {
    top: -15,
    '& *': {
      background: 'transparent',
      color: '#000',
    },
  },
  track: {
    height: 2,
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: '#bfbfbf',
  },
  mark: {
    backgroundColor: '#bfbfbf',
    height: 3,
    width: 1,
    marginTop: -1,
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
})(Slider);

interface IStateProps {
  t: IWsAudioPlayerStrings;
}

interface IProps extends IStateProps {
  visible: boolean;
  blob?: Blob;
  initialposition?: number;
  allowRecord?: boolean;
  allowZoom?: boolean;
  allowSegment?: boolean;
  allowSpeed?: boolean;
  size: number;
  segments: string;
  metaData?: JSX.Element;
  isPlaying?: boolean;
  loading: boolean;
  busy?: boolean;
  setBusy?: (busy: boolean) => void;
  setMimeType?: (type: string) => void;
  setAcceptedMimes?: (types: MimeInfo[]) => void;
  onPlayStatus?: (playing: boolean) => void;
  onProgress?: (progress: number) => void;
  onSegmentChange?: (segments: string) => void;
  onBlobReady?: (blob: Blob) => void;
  setBlobReady?: (ready: boolean) => void;
  setChanged?: (changed: boolean) => void;
  onSaveProgress?: (progress: number) => void; //user initiated
  onDuration?: (duration: number) => void;
  onInteraction?: () => void;
}
function valuetext(value: number) {
  return `${Math.floor(value)}%`;
}

const SPEED_STEP = 0.1;
const MIN_SPEED = 0.5;
const MAX_SPEED = 1.5;
const PLAY_PAUSE_KEY = 'F1,CTRL+SPACE';
const HOME_KEY = 'CTRL+HOME';
const BACK_KEY = 'F2,SHIFT+ARROWLEFT';
const AHEAD_KEY = 'F3,SHIFT+ARROWRIGHT';
const END_KEY = 'CTRL+END';
const SLOWER_KEY = 'F4,CTRL+4';
const FASTER_KEY = 'F5,CTRL+5';
const TIMER_KEY = 'F6,CTRL+6';
const RECORD_KEY = 'F9,CTRL+9';
const LEFT_KEY = 'CTRL+ARROWLEFT';
const RIGHT_KEY = 'CTRL+ARROWRIGHT';

function WSAudioPlayer(props: IProps) {
  const {
    t,
    blob,
    initialposition,
    allowRecord,
    allowZoom,
    allowSegment,
    allowSpeed,
    size,
    segments,
    metaData,
    isPlaying,
    loading,
    busy,
    setBusy,
    setMimeType,
    setAcceptedMimes,
    onProgress,
    onSegmentChange,
    onPlayStatus,
    onBlobReady,
    setBlobReady,
    setChanged,
    onSaveProgress,
    onDuration,
    onInteraction,
  } = props;
  const waveformRef = useRef<any>();
  const timelineRef = useRef<any>();

  const classes = useStyles();
  const [confirmAction, setConfirmAction] = useState<string | JSX.Element>('');
  const [jump] = useState(2);
  const playbackRef = useRef(1);
  const [playbackRate, setPlaybackRatex] = useState(1);
  const playingRef = useRef(false);
  const [playing, setPlayingx] = useState(false);
  const loopingRef = useRef(false);
  const [looping, setLoopingx] = useState(false);
  const [hasRegion, setHasRegion] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [regionParams, setRegionParams] = useState<IRegionParams>();
  const recordStartPosition = useRef(0);
  const recordOverwritePosition = useRef<number | undefined>(undefined);
  const recordingRef = useRef(false);
  const [recording, setRecordingx] = useState(false);
  const readyRef = useRef(false);
  const [ready, setReadyx] = useState(false);
  const [silence, setSilence] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const durationRef = useRef(0);
  const initialPosRef = useRef(initialposition);
  const segmentsRef = useRef(segments);
  const [duration, setDurationx] = useState(0);
  const justPlayButton = allowRecord;
  const processRecordRef = useRef(false);
  const { showMessage } = useSnackBar();
  const [style, setStyle] = useState({
    cursor: busy || loading ? 'progress' : 'default',
  });
  const onSaveProgressRef = useRef<(progress: number) => void | undefined>();
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const {
    wsLoad,
    wsClear,
    wsTogglePlay,
    wsBlob,
    wsPause,
    wsDuration,
    wsPosition,
    wsSetPlaybackRate,
    wsSkip,
    wsGoto,
    wsIsReady,
    wsLoadRegions,
    wsClearRegions,
    wsGetRegions,
    wsLoopRegion,
    wsRegionDelete,
    wsUndo,
    wsInsertAudio,
    wsInsertSilence,
    wsZoom,
    wsPctWidth,
    wsAutoSegment,
    wsPrevRegion,
    wsNextRegion,
    wsRemoveSplitRegion,
    wsAddOrRemoveRegion,
    wsSetHeight,
    wsStartRecord,
    wsStopRecord,
  } = useWaveSurfer(
    waveformRef.current,
    onWSReady,
    onWSProgress,
    onWSRegion,
    onWSCanUndo,
    onWSPlayStatus,
    onInteraction,
    () => {}, //on error...probably should report?
    size - 150,
    allowRecord,
    timelineRef.current
  );
  //because we have to call hooks consistently, call this even if we aren't going to record
  const { startRecording, stopRecording, acceptedMimes } = useMediaRecorder(
    allowRecord,
    onRecordStart,
    onRecordStop,
    onRecordError,
    onRecordDataAvailable
  );

  const paperStyle = {};

  useEffect(() => {
    const playerKeys = [
      {
        key: PLAY_PAUSE_KEY,
        cb: () => {
          handlePlayStatus();
          return true;
        },
      },
      {
        key: HOME_KEY,
        cb: () => {
          if (!readyRef.current || recordingRef.current) return false;
          wsGoto(0);
          return true;
        },
      },
      {
        key: END_KEY,
        cb: () => {
          if (!readyRef.current || recordingRef.current) return false;
          gotoEnd();
          return true;
        },
      },
      { key: BACK_KEY, cb: handleJumpBackward },
      { key: AHEAD_KEY, cb: handleJumpForward },
      { key: TIMER_KEY, cb: handleSendProgress },
    ];

    const speedKeys = [
      { key: FASTER_KEY, cb: handleFaster },
      { key: SLOWER_KEY, cb: handleSlower },
    ];

    const recordKeys = [{ key: RECORD_KEY, cb: handleRecorder }];

    const segmentKeys = [
      { key: LEFT_KEY, cb: handlePrevRegion },
      { key: RIGHT_KEY, cb: handleNextRegion },
    ];

    if (allowRecord) recordKeys.forEach((k) => subscribe(k.key, k.cb));

    if (allowSegment) segmentKeys.forEach((k) => subscribe(k.key, k.cb));

    if (allowSpeed) speedKeys.forEach((k) => subscribe(k.key, k.cb));

    playerKeys.forEach((k) => subscribe(k.key, k.cb));

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      playerKeys.forEach((k) => unsubscribe(k.key));
      recordKeys.forEach((k) => unsubscribe(k.key));
      segmentKeys.forEach((k) => unsubscribe(k.key));
      speedKeys.forEach((k) => unsubscribe(k.key));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    wsSetHeight(size - 150); //does this need to be smarter?
  }, [size, wsSetHeight]);

  useEffect(() => {
    if (initialposition !== initialPosRef.current) {
      if (wsIsReady()) wsGoto(initialposition || 0);
      initialPosRef.current = initialposition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialposition]);

  useEffect(() => {
    if (segments !== segmentsRef.current) {
      segmentsRef.current = segments;
      if (ready) {
        wsLoadRegions(segments);
        var regions = JSON.parse(segments)?.regions;
        if (regions) {
          regions = JSON.parse(regions);
          if (Array.isArray(regions) && regions.length) {
            const start = regions[0].start;
            wsGoto(start);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  useEffect(() => {
    onSaveProgressRef.current = onSaveProgress;
  }, [onSaveProgress]);

  useEffect(() => {
    setDuration(0);
    setHasRegion(0);
    if (blob) {
      if (setBusy) setBusy(true); //turned off on ready
      wsLoad(blob, undefined);
    } else {
      if (setBusy) setBusy(false);
      wsClear();
      initialPosRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]); //passed in by user

  useEffect(() => {
    if (setAcceptedMimes) setAcceptedMimes(acceptedMimes);
  }, [acceptedMimes, setAcceptedMimes]);

  useEffect(() => {
    wsSetPlaybackRate(playbackRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRate]);

  useEffect(() => {
    setStyle({
      cursor: busy || loading ? 'progress' : 'default',
    });
  }, [busy, loading]);

  const handlePlayStatus = () => {
    if (durationRef.current === 0 || recordingRef.current) return false;
    const playing = wsTogglePlay();
    setPlaying(playing);
    if (onPlayStatus && isPlaying !== undefined && playing !== isPlaying)
      onPlayStatus(playing);
  };

  useEffect(() => {
    if (isPlaying !== undefined && playing !== isPlaying) handlePlayStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  function onRecordStart() {}

  async function onRecordStop(blob: Blob) {
    await wsInsertAudio(
      blob,
      recordStartPosition.current,
      recordOverwritePosition.current || recordStartPosition.current
    );
    recordOverwritePosition.current = undefined;
    processRecordRef.current = false;
    setReady(true);
    handleChanged();
  }

  function onRecordError(e: any) {
    showMessage(e.error);
  }
  async function onRecordDataAvailable(e: any, blob: Blob) {
    var newPos = await wsInsertAudio(
      blob,
      recordStartPosition.current,
      recordOverwritePosition.current || recordStartPosition.current,
      e.type
    );
    recordOverwritePosition.current = newPos;
    setDuration(wsDuration());
  }
  function onWSReady() {
    setReady(true);
    setDuration(wsDuration());
    if (segmentsRef.current?.length > 2) wsLoadRegions(segmentsRef.current);
    if (setBusy) setBusy(false);
    if (initialPosRef.current) wsGoto(initialPosRef.current);
  }
  function onWSProgress(progress: number) {
    setProgress(progress);
    if (onProgress) onProgress(progress);
  }
  function onWSRegion(
    count: number,
    params: IRegionParams | undefined,
    newRegion: boolean
  ) {
    setHasRegion(count);
    setRegionParams(params);
    if (onSegmentChange && newRegion) onSegmentChange(wsGetRegions());
  }
  function onWSCanUndo(canUndo: boolean) {
    setCanUndo(canUndo);
  }
  function onWSPlayStatus(status: boolean) {
    setPlaying(status);
    if (onPlayStatus) onPlayStatus(status);
  }

  const handleSliderChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) value = value[0]; //won't be
    setPlaybackRate(value / 100);
  };
  const handleSlower = () => {
    if (playbackRef.current === MIN_SPEED || recordingRef.current) return false;
    setPlaybackRate(Math.max(MIN_SPEED, playbackRef.current - SPEED_STEP));
    return true;
  };
  const setPlaying = (value: boolean) => {
    playingRef.current = value;
    setPlayingx(value);
  };
  const setLooping = (value: boolean) => {
    loopingRef.current = value;
    setLoopingx(value);
  };
  const setPlaybackRate = (value: number) => {
    var newVal = parseFloat(value.toFixed(2));
    playbackRef.current = newVal;
    setPlaybackRatex(newVal);
  };

  const setDuration = (value: number) => {
    durationRef.current = value;
    setDurationx(value);
    if (onDuration) onDuration(value);
  };
  const setReady = (value: boolean) => {
    setReadyx(value);
    readyRef.current = value;
  };
  const handleFaster = () => {
    if (playbackRef.current === MAX_SPEED || recordingRef.current) return false;
    setPlaybackRate(Math.min(MAX_SPEED, playbackRef.current + SPEED_STEP));
    return true;
  };

  const handleJumpForward = () => {
    return handleJumpFn(jump);
  };
  const handleJumpBackward = () => {
    return handleJumpFn(-1 * jump);
  };
  const handleJumpFn = (amount: number) => {
    if (!readyRef.current || recordingRef.current) return false;
    wsSkip(amount);
    return true;
  };
  const handleJumpEv = (amount: number) => () => handleJumpFn(amount);
  const handleGotoEv = (place: number) => () => wsGoto(place);
  const handleToggleLoop = () => {
    setLooping(wsLoopRegion(!looping));
  };
  const handlePrevRegion = () => {
    setPlaying(wsPrevRegion());
    return true;
  };
  const handleNextRegion = () => {
    setPlaying(wsNextRegion());
    return true;
  };

  const gotoEnd = () => {
    wsPause();
    setPlaying(false);
    wsGoto(durationRef.current);
  };
  const handleGoToEnd = () => {
    gotoEnd();
  };
  const handleSendProgress = () => {
    if (onSaveProgressRef.current) {
      onSaveProgressRef.current(wsPosition());
      return true;
    }
    return false;
  };

  const setRecording = (value: boolean) => {
    recordingRef.current = value;
    setRecordingx(value);
  };
  const handleRecorder = () => {
    if (!allowRecord || playingRef.current || processRecordRef.current)
      return false;
    if (!recordingRef.current) {
      wsPause(); //stop if playing
      recordStartPosition.current = wsPosition();
      recordOverwritePosition.current = recordStartPosition.current;
      initialPosRef.current = recordStartPosition.current;
      wsStartRecord();
      startRecording(500);
    } else {
      processRecordRef.current = true;
      stopRecording();
      wsStopRecord();
    }
    setRecording(!recordingRef.current);
    return true;
  };

  const handleChanged = async () => {
    if (setChanged) setChanged(durationRef.current !== 0);
    if (setBlobReady) setBlobReady(false);
    wsBlob().then((newblob) => {
      if (onBlobReady && newblob) onBlobReady(newblob);
      if (setBlobReady) setBlobReady(true);
      if (setMimeType && newblob?.type) setMimeType(newblob?.type);
      setDuration(wsDuration());
    });
  };
  const handleActionConfirmed = () => {
    initialPosRef.current = undefined;
    if (confirmAction === t.deleteRecording) {
      wsClear();
      setDuration(0);
      if (setChanged) setChanged(false);
      if (setBlobReady) setBlobReady(true);
    } else {
      wsRegionDelete();
      handleChanged();
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  const handleDelete = () => {
    setConfirmAction(t.deleteRecording);
  };
  const handleDeleteRegion = () => {
    setConfirmAction(t.deleteRegion);
  };
  const handleUndo = () => {
    wsUndo();
    handleChanged();
  };
  const handleAddSilence = () => () => {
    wsInsertSilence(silence, wsPosition());
    handleChanged();
  };

  const handleChangeSilence = (e: any) => {
    //check if its a number
    e.persist();
    setSilence(e.target.value);
  };
  const onSplit = (split: IRegionChange) => {};

  return (
    <div className={classes.root}>
      <Paper className={classes.paper} style={paperStyle}>
        <div className={classes.main} style={style}>
          <Grid container className={classes.toolbar}>
            {allowRecord && (
              <>
                <Grid item>
                  <LightTooltip
                    id="wsAudioRecordTip"
                    title={(recording ? t.pause : t.record).replace(
                      '{0}',
                      RECORD_KEY
                    )}
                  >
                    <span>
                      <IconButton
                        id="wsAudioRecord"
                        className={classes.record}
                        onClick={handleRecorder}
                        disabled={
                          playingRef.current || processRecordRef.current
                        }
                      >
                        {recording ? <FaStopCircle /> : <FaDotCircle />}
                      </IconButton>
                    </span>
                  </LightTooltip>
                </Grid>
                <Grid item>
                  <LightTooltip
                    id="wsAudioPlayTip"
                    title={(playing ? t.pauseTip : t.playTip).replace(
                      '{0}',
                      localizeHotKey(PLAY_PAUSE_KEY)
                    )}
                  >
                    <span>
                      <IconButton
                        id="wsAudioPlay"
                        onClick={handlePlayStatus}
                        disabled={duration === 0 || recording}
                      >
                        <>
                          {playing ? (
                            allowRecord ? (
                              <StopIcon />
                            ) : (
                              <PauseIcon />
                            )
                          ) : (
                            <PlayIcon />
                          )}
                        </>
                      </IconButton>
                    </span>
                  </LightTooltip>
                </Grid>
                <Divider
                  id="wsAudioDiv1"
                  className={classes.divider}
                  orientation="vertical"
                  flexItem
                />
              </>
            )}
            <Grid item>
              <Typography className={classes.duration}>
                <Duration id="wsAudioPosition" seconds={progress} /> {' / '}
                <Duration id="wsAudioDuration" seconds={duration} />
              </Typography>
            </Grid>
            <Divider
              id="wsAudioDiv2"
              className={classes.divider}
              orientation="vertical"
              flexItem
            />
            {allowZoom && (
              <>
                <Grid item>
                  <WSAudioPlayerZoom
                    startBig={allowRecord || false}
                    ready={ready}
                    wsZoom={wsZoom}
                    wsPctWidth={wsPctWidth}
                    t={t}
                  ></WSAudioPlayerZoom>
                </Grid>
                <Divider
                  id="wsAudioDiv3"
                  className={classes.divider}
                  orientation="vertical"
                  flexItem
                />
              </>
            )}
            {allowRecord && (
              <>
                <div className={classes.labeledControl}>
                  <InputLabel
                    id="wsAudioAddSilenceLabel"
                    className={classes.smallFont}
                  >
                    {t.silence}
                  </InputLabel>
                  <LightTooltip id="wsAudioAddSilenceTip" title={t.silence}>
                    <span>
                      <IconButton
                        id="wsAudioAddSilence"
                        className={classes.togglebutton}
                        onClick={handleAddSilence()}
                        disabled={
                          !ready ||
                          recording ||
                          playingRef.current ||
                          processRecordRef.current
                        }
                      >
                        <SilenceIcon />
                      </IconButton>
                    </span>
                  </LightTooltip>
                </div>
                <div className={classes.labeledControl}>
                  <InputLabel
                    id="wsAudioSilenceLabel"
                    className={classes.smallFont}
                  >
                    {t.seconds}
                  </InputLabel>
                  <Input
                    id="wsAudioSilence"
                    className={classes.formControl}
                    type="number"
                    inputProps={{ min: '0.1', step: '0.1' }}
                    value={silence}
                    onChange={handleChangeSilence}
                  />
                </div>
                <Divider
                  id="wsAudioDiv4"
                  className={classes.divider}
                  orientation="vertical"
                  flexItem
                />
                {hasRegion !== 0 && (
                  <LightTooltip
                    id="wsAudioDeleteRegionTip"
                    title={t.deleteRegion}
                  >
                    <IconButton
                      id="wsAudioDeleteRegion"
                      onClick={handleDeleteRegion}
                      disabled={recording}
                    >
                      <FaHandScissors />
                    </IconButton>
                  </LightTooltip>
                )}
                {canUndo && (
                  <LightTooltip id="wsUndoTip" title={t.undoTip}>
                    <IconButton
                      id="wsUndo"
                      onClick={handleUndo}
                      disabled={recording}
                    >
                      <UndoIcon />
                    </IconButton>
                  </LightTooltip>
                )}
                {hasRegion === 0 && (
                  <LightTooltip id="wsAudioDeleteTip" title={t.deleteRecording}>
                    <span>
                      <IconButton
                        id="wsAudioDelete"
                        onClick={handleDelete}
                        disabled={recording || duration === 0}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </LightTooltip>
                )}
                <div className={classes.grow}>{'\u00A0'}</div>
              </>
            )}
            {allowSegment && (
              <WSAudioPlayerSegment
                ready={ready}
                onSplit={onSplit}
                loop={loopingRef.current || false}
                playing={playing}
                currentNumRegions={hasRegion}
                params={regionParams}
                wsAutoSegment={wsAutoSegment}
                wsRemoveSplitRegion={wsRemoveSplitRegion}
                wsAddOrRemoveRegion={wsAddOrRemoveRegion}
                wsClearRegions={wsClearRegions}
                setBusy={setBusy}
                t={t}
              />
            )}
          </Grid>
          <div id="wsAudioTimeline" ref={timelineRef} />
          <div id="wsAudioWaveform" ref={waveformRef} />
          {justPlayButton || (
            <Grid container className={classes.toolbar}>
              <Grid item>
                <LightTooltip
                  id="wsAudioLoopTip"
                  title={looping ? t.loopon : t.loopoff}
                >
                  <span>
                    <ToggleButton
                      id="wsAudioLoop"
                      className={classes.togglebutton}
                      value="loop"
                      selected={looping}
                      onChange={handleToggleLoop}
                      disabled={!hasRegion}
                    >
                      <LoopIcon />
                    </ToggleButton>
                  </span>
                </LightTooltip>
                {allowSegment && (
                  <>
                    <LightTooltip
                      id="wsPrevTip"
                      title={t.prevRegion.replace(
                        '{0}',
                        localizeHotKey(LEFT_KEY)
                      )}
                    >
                      <span>
                        <IconButton
                          disabled={!hasRegion}
                          id="wsNext"
                          onClick={handlePrevRegion}
                        >
                          <NextSegmentIcon className={classes.flipIcon} />
                        </IconButton>
                      </span>
                    </LightTooltip>
                    <LightTooltip
                      id="wsNextTip"
                      title={t.nextRegion.replace(
                        '{0}',
                        localizeHotKey(RIGHT_KEY)
                      )}
                    >
                      <span>
                        <IconButton
                          disabled={!hasRegion}
                          id="wsNext"
                          onClick={handleNextRegion}
                        >
                          <NextSegmentIcon />
                        </IconButton>
                      </span>
                    </LightTooltip>
                  </>
                )}
              </Grid>
              <Divider
                id="wsAudioDiv5"
                className={classes.divider}
                orientation="vertical"
                flexItem
              />
              <Grid item>
                <>
                  <LightTooltip
                    id="wsAudioHomeTip"
                    title={t.beginningTip.replace(
                      '{0}',
                      localizeHotKey(HOME_KEY)
                    )}
                  >
                    <span>
                      <IconButton
                        id="wsAudioHome"
                        onClick={handleGotoEv(0)}
                        disabled={!ready || recording}
                      >
                        <SkipPreviousIcon />
                      </IconButton>
                    </span>
                  </LightTooltip>
                  <LightTooltip
                    id="wsAudioBackTip"
                    title={t.backTip
                      .replace('{jump}', jump.toString())
                      .replace('{1}', t.seconds)
                      .replace('{0}', localizeHotKey(BACK_KEY))}
                  >
                    <span>
                      <IconButton
                        id="wsAudioBack"
                        onClick={handleJumpEv(-1 * jump)}
                        disabled={!ready || recording}
                      >
                        <ReplayIcon />
                      </IconButton>
                    </span>
                  </LightTooltip>

                  <LightTooltip
                    id="wsAudioPlayTip"
                    title={(playing ? t.pauseTip : t.playTip).replace(
                      '{0}',
                      localizeHotKey(PLAY_PAUSE_KEY)
                    )}
                  >
                    <span>
                      <IconButton
                        id="wsAudioPlay"
                        onClick={handlePlayStatus}
                        disabled={duration === 0 || recording}
                      >
                        <>{playing ? <PauseIcon /> : <PlayIcon />}</>
                      </IconButton>
                    </span>
                  </LightTooltip>
                  <LightTooltip
                    id="wsAudioForwardTip"
                    title={t.aheadTip
                      .replace('{jump}', jump.toString())
                      .replace('{1}', t.seconds)
                      .replace('{0}', localizeHotKey(AHEAD_KEY))}
                  >
                    <span>
                      <IconButton
                        id="wsAudioForward"
                        onClick={handleJumpEv(jump)}
                        disabled={!ready || recording}
                      >
                        <ForwardIcon />{' '}
                      </IconButton>
                    </span>
                  </LightTooltip>

                  <LightTooltip
                    id="wsAudioEndTip"
                    title={t.endTip.replace('{0}', localizeHotKey(END_KEY))}
                  >
                    <span>
                      <IconButton
                        id="wsAudioEnd"
                        onClick={handleGoToEnd}
                        disabled={!ready || recording}
                      >
                        <SkipNextIcon />{' '}
                      </IconButton>
                    </span>
                  </LightTooltip>
                </>
              </Grid>
              {allowSpeed && (
                <>
                  <Divider
                    id="wsAudioDiv6"
                    className={classes.divider}
                    orientation="vertical"
                    flexItem
                  />
                  <Grid item>
                    <div className={classes.toolbar}>
                      <LightTooltip
                        id="wsAudioSlowerTip"
                        title={t.slowerTip.replace(
                          '{0}',
                          localizeHotKey(SLOWER_KEY)
                        )}
                      >
                        <span>
                          <IconButton
                            id="wsAudioSlower"
                            onClick={handleSlower}
                            disabled={playbackRate === MIN_SPEED || recording}
                          >
                            <FaAngleDoubleDown fontSize="small" />{' '}
                          </IconButton>
                        </span>
                      </LightTooltip>
                      <IOSSlider
                        id="wsAudioPlaybackSpeed"
                        aria-label="ios slider"
                        value={
                          typeof playbackRate === 'number'
                            ? playbackRate * 100
                            : 0
                        }
                        step={SPEED_STEP * 100}
                        marks
                        min={MIN_SPEED * 100}
                        max={MAX_SPEED * 100}
                        valueLabelDisplay="on"
                        getAriaValueText={valuetext}
                        valueLabelFormat={valuetext}
                        onChange={handleSliderChange}
                      />

                      <LightTooltip
                        id="wsAudioFasterTip"
                        title={t.fasterTip.replace(
                          '{0}',
                          localizeHotKey(FASTER_KEY)
                        )}
                      >
                        <span>
                          <IconButton
                            id="wsAudioFaster"
                            onClick={handleFaster}
                            disabled={playbackRate === MAX_SPEED || recording}
                          >
                            <FaAngleDoubleUp fontSize="small" />{' '}
                          </IconButton>
                        </span>
                      </LightTooltip>
                    </div>
                  </Grid>
                </>
              )}
              {onSaveProgress && (
                <>
                  <Divider
                    id="wsAudioDiv7"
                    className={classes.divider}
                    orientation="vertical"
                    flexItem
                  />
                  <Grid item>
                    <LightTooltip
                      id="wsAudioTimestampTip"
                      title={t.timerTip.replace(
                        '{0}',
                        localizeHotKey(TIMER_KEY)
                      )}
                    >
                      <span>
                        <IconButton
                          id="wsAudioTimestamp"
                          onClick={handleSendProgress}
                        >
                          <>
                            <TimerIcon />
                          </>
                        </IconButton>
                      </span>
                    </LightTooltip>
                  </Grid>
                  {metaData}
                </>
              )}
              <Grid item className={classes.grow}>
                {'\u00A0'}
              </Grid>
            </Grid>
          )}
          {confirmAction === '' || (
            <Confirm
              jsx={<span></span>}
              text={confirmAction}
              yesResponse={handleActionConfirmed}
              noResponse={handleActionRefused}
            />
          )}
        </div>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'wsAudioPlayer' }),
});

export default connect(mapStateToProps)(WSAudioPlayer) as any;
