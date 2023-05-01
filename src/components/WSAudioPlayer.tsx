import {
  Paper,
  IconButton,
  Typography,
  InputLabel,
  Divider,
  DividerProps,
  Input,
  Grid,
  ToggleButton,
  Box,
  SxProps,
} from '@mui/material';
import { useState, useEffect, useRef, useContext } from 'react';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ForwardIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import LoopIcon from '@mui/icons-material/Loop';
import DeleteIcon from '@mui/icons-material/Delete';
import SilenceIcon from '@mui/icons-material/SpaceBar';
import TimerIcon from '@mui/icons-material/AccessTime';
import NextSegmentIcon from '@mui/icons-material/ArrowRightAlt';
import UndoIcon from '@mui/icons-material/Undo';
import { IWsAudioPlayerStrings } from '../model';
import {
  FaHandScissors,
  FaAngleDoubleUp,
  FaAngleDoubleDown,
  FaDotCircle,
  FaStopCircle,
} from 'react-icons/fa';

import { MimeInfo, useMediaRecorder } from '../crud/useMediaRecorder';
import { IMarker, useWaveSurfer } from '../crud/useWaveSurfer';
import { Duration, GrowingSpacer, LightTooltip, IosSlider } from '../control';
import { useSnackBar } from '../hoc/SnackBar';
import { HotKeyContext } from '../context/HotKeyContext';
import WSAudioPlayerZoom from './WSAudioPlayerZoom';
import {
  IRegion,
  IRegionChange,
  IRegionParams,
  parseRegionParams,
  parseRegions,
} from '../crud/useWavesurferRegions';
import WSAudioPlayerSegment from './WSAudioPlayerSegment';
import Confirm from './AlertDialog';
import { NamedRegions } from '../utils';
import { wsAudioPlayerSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

const VertDivider = (prop: DividerProps) => (
  <Divider orientation="vertical" flexItem sx={{ ml: '5px' }} {...prop} />
);

const toolbarProp = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyItems: 'flex-start',
  display: 'flex',
} as SxProps;

const labeledControlProp = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const smallLabel = { fontSize: 'small' } as SxProps;

interface IProps {
  id?: string;
  visible?: boolean;
  blob?: Blob;
  initialposition?: number;
  allowRecord?: boolean;
  allowZoom?: boolean;
  allowSegment?: NamedRegions | undefined;
  allowAutoSegment?: boolean;
  allowSpeed?: boolean;
  allowSilence?: boolean;
  alternatePlayer?: boolean;
  oneTryOnly?: boolean;
  size: number;
  segments: string;
  currentSegmentIndex?: number;
  markers?: IMarker[];
  metaData?: JSX.Element;
  isPlaying?: boolean;
  regionOnly?: boolean;
  loading?: boolean;
  busy?: boolean;
  defaultRegionParams?: IRegionParams;
  canSetDefaultParams?: boolean;
  doReset?: boolean;
  autoStart?: boolean;
  setBusy?: (busy: boolean) => void;
  setMimeType?: (type: string) => void;
  setAcceptedMimes?: (types: MimeInfo[]) => void;
  onPlayStatus?: (playing: boolean) => void;
  onProgress?: (progress: number) => void;
  onSegmentChange?: (segments: string) => void;
  onSegmentParamChange?: (params: IRegionParams, teamDefault: boolean) => void;
  onBlobReady?: (blob: Blob | undefined) => void;
  setBlobReady?: (ready: boolean) => void;
  setChanged?: (changed: boolean) => void;
  onSaveProgress?: (progress: number) => void; //user initiated
  onDuration?: (duration: number) => void;
  onInteraction?: () => void;
  onRecording?: (r: boolean) => void;
  onCurrentSegment?: (currentSegment: IRegion | undefined) => void;
  onMarkerClick?: (time: number) => void;
}
function valuetext(value: number) {
  return `${Math.floor(value)}%`;
}

const SPEED_STEP = 0.1;
const MIN_SPEED = 0.5;
const MAX_SPEED = 1.5;
const PLAY_PAUSE_KEY = 'F1,CTRL+SPACE';
const ALT_PLAY_PAUSE_KEY = 'ALT+F1,ALT+CTRL+SPACE';
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
    blob,
    initialposition,
    allowRecord,
    allowZoom,
    allowSegment,
    allowAutoSegment,
    allowSpeed,
    allowSilence,
    oneTryOnly,
    size,
    segments,
    currentSegmentIndex,
    markers,
    metaData,
    isPlaying,
    regionOnly,
    loading,
    busy,
    defaultRegionParams,
    canSetDefaultParams,
    doReset,
    autoStart,
    setBusy,
    setMimeType,
    setAcceptedMimes,
    onProgress,
    onSegmentChange,
    onSegmentParamChange,
    onPlayStatus,
    onBlobReady,
    setBlobReady,
    setChanged,
    onSaveProgress,
    onDuration,
    onInteraction,
    onRecording,
    onCurrentSegment,
    onMarkerClick,
  } = props;
  const waveformRef = useRef<any>();
  const timelineRef = useRef<any>();

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
  const markersRef = useRef<IMarker[]>([]);
  const [duration, setDurationx] = useState(0);
  const justPlayButton = allowRecord;
  const processRecordRef = useRef(false);
  const { showMessage } = useSnackBar();
  const t: IWsAudioPlayerStrings = useSelector(
    wsAudioPlayerSelector,
    shallowEqual
  );
  const [style, setStyle] = useState({
    cursor: busy || loading ? 'progress' : 'default',
  });
  const autostartTimer = useRef<NodeJS.Timeout>();
  const onSaveProgressRef = useRef<(progress: number) => void | undefined>();
  const [oneShotUsed, setOneShotUsed] = useState(false);

  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const {
    wsLoad,
    wsClear,
    wsTogglePlay,
    wsPlayRegion,
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
    wsAddMarkers,
  } = useWaveSurfer(
    waveformRef.current,
    onWSReady,
    onWSProgress,
    onWSRegion,
    onWSCanUndo,
    onWSPlayStatus,
    onInteraction,
    onMarkerClick,
    () => {}, //on error...probably should report?
    allowZoom ? size - 120 : size - 106,
    allowRecord,
    timelineRef.current,
    currentSegmentIndex,
    onCurrentSegment
  );
  //because we have to call hooks consistently, call this even if we aren't going to record
  const { startRecording, stopRecording, acceptedMimes } = useMediaRecorder(
    allowRecord,
    onRecordStart,
    onRecordStop,
    onRecordError,
    onRecordDataAvailable
  );

  //#region hotkey handlers
  const handleFaster = () => {
    if (playbackRef.current === MAX_SPEED || recordingRef.current) return false;
    setPlaybackRate(Math.min(MAX_SPEED, playbackRef.current + SPEED_STEP));
    return true;
  };
  const handleSlower = () => {
    if (playbackRef.current === MIN_SPEED || recordingRef.current) return false;
    setPlaybackRate(Math.max(MIN_SPEED, playbackRef.current - SPEED_STEP));
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
  const handleRecorder = () => {
    if (
      !allowRecord ||
      playingRef.current ||
      processRecordRef.current ||
      oneShotUsed
    )
      return false;
    if (!recordingRef.current) {
      setBlobReady && setBlobReady(false);
      wsPause(); //stop if playing
      recordStartPosition.current = wsPosition();
      recordOverwritePosition.current = recordStartPosition.current;
      wsStartRecord();
      setRecording(startRecording(500));
    } else {
      processRecordRef.current = true;
      stopRecording();
      wsStopRecord();
      setRecording(false);
      if (oneTryOnly) setOneShotUsed(true);
    }
    return true;
  };

  const setRecording = (value: boolean) => {
    recordingRef.current = value;
    setRecordingx(value);
    if (onRecording) onRecording(value);
  };
  //#endregion

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
  const simplePlayerKeys = [
    {
      key: ALT_PLAY_PAUSE_KEY,
      cb: () => {
        handlePlayStatus();
        return true;
      },
    },
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

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      playerKeys.forEach((k) => unsubscribe(k.key));
      simplePlayerKeys.forEach((k) => unsubscribe(k.key));
      recordKeys.forEach((k) => unsubscribe(k.key));
      segmentKeys.forEach((k) => unsubscribe(k.key));
      speedKeys.forEach((k) => unsubscribe(k.key));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (justPlayButton) simplePlayerKeys.forEach((k) => subscribe(k.key, k.cb));
    else playerKeys.forEach((k) => subscribe(k.key, k.cb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justPlayButton]);

  useEffect(() => {
    if (allowRecord) recordKeys.forEach((k) => subscribe(k.key, k.cb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowRecord]);
  useEffect(() => {
    if (allowSegment) segmentKeys.forEach((k) => subscribe(k.key, k.cb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSegment]);
  useEffect(() => {
    if (allowSpeed) speedKeys.forEach((k) => subscribe(k.key, k.cb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSpeed]);

  const cleanupAutoStart = () => {
    if (autostartTimer.current) {
      try {
        //make sure clearTimeout is not imported from timers
        clearTimeout(autostartTimer.current);
      } catch (error) {
        console.log(error);
      }
      autostartTimer.current = undefined;
    }
  };
  const launchTimer = () => {
    autostartTimer.current = setTimeout(() => {
      handleRecorder();
    }, 1000 * 0.5);
  };
  useEffect(() => {
    if (autoStart) {
      launchTimer();
    }
    return () => {
      cleanupAutoStart();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  useEffect(() => {
    wsSetHeight(allowZoom ? size - 120 : size - 106); //does this need to be smarter?
  }, [size, wsSetHeight, allowZoom]);

  useEffect(() => {
    if (
      initialposition !== undefined &&
      initialposition !== initialPosRef.current
    ) {
      if (wsIsReady()) wsGoto(initialposition);
    }
    initialPosRef.current = initialposition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialposition]);

  useEffect(() => {
    if (ready && markers && markers !== markersRef.current) {
      markersRef.current = markers;
      wsAddMarkers(markers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, ready]);

  useEffect(() => {
    if (segments !== segmentsRef.current) {
      segmentsRef.current = segments;
      if (ready && segmentsRef.current !== wsGetRegions()) {
        loadRegions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, looping]);

  const loadRegions = () => {
    wsLoadRegions(segmentsRef.current, loopingRef.current);
    var region = parseRegions(segmentsRef.current);
    if (region.regions.length) {
      const start = region.regions[0].start;
      wsGoto(start);
    }
    var params = parseRegionParams(segmentsRef.current, defaultRegionParams);
    if (params && params !== defaultRegionParams && onSegmentParamChange)
      onSegmentParamChange(params, false);
  };

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
      wsClear(true);
      initialPosRef.current = undefined;
      recordStartPosition.current = 0;
      setOneShotUsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob, doReset]); //passed in by user

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
    var nowplaying = true;
    if (regionOnly) {
      wsPlayRegion();
    } else nowplaying = wsTogglePlay();
    if (
      nowplaying &&
      wsPosition().toFixed(2) === durationRef.current.toFixed(2)
    )
      wsGoto(0);
    setPlaying(nowplaying);
    if (onPlayStatus && isPlaying !== undefined && nowplaying !== isPlaying) {
      onPlayStatus(nowplaying);
    }
  };

  useEffect(() => {
    if (isPlaying !== undefined && playingRef.current !== isPlaying)
      handlePlayStatus();
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
    processRecordRef.current = false;
    if (autostartTimer.current && e.error === 'No mediaRecorder') {
      cleanupAutoStart();
      launchTimer();
    } else {
      showMessage(e.error || e.toString());
    }
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
    wsGoto(newPos || wsDuration());
  }
  function onWSReady() {
    setReady(true);
    setDuration(wsDuration());
    if (segmentsRef.current?.length > 2) loadRegions();

    if (setBusy) setBusy(false);
    if (initialPosRef.current) wsGoto(initialPosRef.current);
  }
  function onWSProgress(progress: number) {
    setProgress(progress);
    if (onProgress) onProgress(progress);
  }
  function onWSRegion(count: number, newRegion: boolean) {
    setHasRegion(count);
    if (onSegmentChange && newRegion) onSegmentChange(wsGetRegions());
  }
  function onWSCanUndo(canUndo: boolean) {
    setCanUndo(canUndo);
  }
  function onWSPlayStatus(status: boolean) {
    setPlaying(status);
    if (onPlayStatus) onPlayStatus(status);
  }

  const handleSliderChange = (event: Event, value: number | number[]) => {
    if (Array.isArray(value)) value = value[0]; //won't be
    setPlaybackRate(value / 100);
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

  const handleChanged = async () => {
    setChanged && setChanged(durationRef.current !== 0);
    setBlobReady && setBlobReady(false);
    wsBlob().then((newblob) => {
      onBlobReady && onBlobReady(newblob);
      setBlobReady && setBlobReady(newblob !== undefined);
      if (setMimeType && newblob?.type) setMimeType(newblob?.type);
      setDuration(wsDuration());
    });
  };
  const handleActionConfirmed = () => {
    initialPosRef.current = undefined;
    if (confirmAction === t.deleteRecording) {
      setPlaying(false);
      wsClear();
      setDuration(0);
      setChanged && setChanged(false);
      onBlobReady && onBlobReady(undefined);
      setBlobReady && setBlobReady(false);
      oneShotUsed && setOneShotUsed(false);
      setReady(false);
    } else {
      handleDeleteRegion();
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
    setPlaying(false);
    wsRegionDelete();
    handleChanged();
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
    <Box sx={{ flexGrow: 1 }}>
      <Paper sx={{ p: 1, margin: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            whiteSpace: 'nowrap',
          }}
          style={style}
        >
          <>
            <Grid container sx={toolbarProp}>
              {allowRecord && (
                <>
                  {!oneShotUsed && (
                    <Grid item>
                      <LightTooltip
                        id="wsAudioRecordTip"
                        title={(recording
                          ? oneTryOnly
                            ? t.stopTip
                            : t.pauseTip
                          : t.record
                        ).replace('{0}', RECORD_KEY)}
                      >
                        <span>
                          <IconButton
                            id="wsAudioRecord"
                            sx={{ color: 'red' }}
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
                  )}
                  <Grid item>
                    <LightTooltip
                      id="wsAudioPlayTip"
                      title={(playing
                        ? oneTryOnly
                          ? t.stopTip
                          : t.pauseTip
                        : t.playTip
                      ).replace(
                        '{0}',
                        localizeHotKey(
                          justPlayButton ? ALT_PLAY_PAUSE_KEY : PLAY_PAUSE_KEY
                        )
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
                  </Grid>
                  <VertDivider id="wsAudioDiv1" />
                </>
              )}
              <Grid item>
                <Typography sx={{ m: '5px' }}>
                  <Duration id="wsAudioPosition" seconds={progress} /> {' / '}
                  <Duration id="wsAudioDuration" seconds={duration} />
                </Typography>
              </Grid>
              <VertDivider id="wsAudioDiv2" />
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
                  <VertDivider id="wsAudioDiv3" />
                </>
              )}
              {allowRecord && (
                <>
                  {allowSilence && (
                    <>
                      <Box sx={labeledControlProp}>
                        <>
                          <InputLabel
                            id="wsAudioAddSilenceLabel"
                            sx={smallLabel}
                          >
                            {t.silence}
                          </InputLabel>
                          <LightTooltip
                            id="wsAudioAddSilenceTip"
                            title={t.silence}
                          >
                            <span>
                              <IconButton
                                id="wsAudioAddSilence"
                                sx={{ mx: 1 }}
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
                        </>
                      </Box>
                      <Box sx={labeledControlProp}>
                        <>
                          <InputLabel id="wsAudioSilenceLabel" sx={smallLabel}>
                            {t.seconds}
                          </InputLabel>
                          <Input
                            id="wsAudioSilence"
                            sx={{ m: 1, maxWidth: 50 }}
                            type="number"
                            inputProps={{ min: '0.1', step: '0.1' }}
                            value={silence}
                            onChange={handleChangeSilence}
                          />
                        </>
                      </Box>
                      <VertDivider id="wsAudioDiv4" />{' '}
                    </>
                  )}
                  {hasRegion !== 0 && !oneShotUsed && (
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
                  {canUndo && !oneShotUsed && (
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
                    <LightTooltip
                      id="wsAudioDeleteTip"
                      title={t.deleteRecording}
                    >
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
                  <GrowingSpacer />
                </>
              )}
              {allowSegment && (
                <WSAudioPlayerSegment
                  ready={ready}
                  onSplit={onSplit}
                  onParamChange={onSegmentParamChange}
                  loop={loopingRef.current || false}
                  playing={playing}
                  currentNumRegions={hasRegion}
                  params={defaultRegionParams}
                  canSetDefault={canSetDefaultParams}
                  wsAutoSegment={allowAutoSegment ? wsAutoSegment : undefined}
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
              <Grid container sx={toolbarProp}>
                <Grid item>
                  {allowAutoSegment && (
                    <LightTooltip
                      id="wsAudioLoopTip"
                      title={looping ? t.loopon : t.loopoff}
                    >
                      <span>
                        <ToggleButton
                          id="wsAudioLoop"
                          sx={{ mx: 1 }}
                          value="loop"
                          selected={looping}
                          onChange={handleToggleLoop}
                          disabled={!hasRegion}
                        >
                          <LoopIcon />
                        </ToggleButton>
                      </span>
                    </LightTooltip>
                  )}
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
                            <NextSegmentIcon
                              sx={{ transform: 'rotate(180deg)' }}
                            />
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
                <VertDivider id="wsAudioDiv5" />
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
                      title={(playing
                        ? oneTryOnly
                          ? t.stopTip
                          : t.pauseTip
                        : t.playTip
                      ).replace('{0}', localizeHotKey(PLAY_PAUSE_KEY))}
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
                    <VertDivider id="wsAudioDiv6" />
                    <Grid item>
                      <Box sx={toolbarProp}>
                        <>
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
                                disabled={
                                  playbackRate === MIN_SPEED || recording
                                }
                              >
                                <FaAngleDoubleDown fontSize="small" />{' '}
                              </IconButton>
                            </span>
                          </LightTooltip>
                          <IosSlider
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
                                disabled={
                                  playbackRate === MAX_SPEED || recording
                                }
                              >
                                <FaAngleDoubleUp fontSize="small" />{' '}
                              </IconButton>
                            </span>
                          </LightTooltip>
                        </>
                      </Box>
                    </Grid>
                  </>
                )}
                {onSaveProgress && (
                  <>
                    <VertDivider id="wsAudioDiv7" />
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
                <Grid item sx={{ flexGrow: 1 }}>
                  {'\u00A0'}
                </Grid>
                {!onSaveProgress && <>{metaData}</>}
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
          </>
        </Box>
      </Paper>
    </Box>
  );
}

export default WSAudioPlayer;
