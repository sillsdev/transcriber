import {
  Paper,
  IconButton,
  Typography,
  Divider,
  DividerProps,
  Grid,
  ToggleButton,
  Box,
  SxProps,
  Badge,
} from '@mui/material';
import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ForwardIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import LoopIcon from '@mui/icons-material/Loop';
import DeleteIcon from '@mui/icons-material/Delete';
import TimerIcon from '@mui/icons-material/AccessTime';
import NextSegmentIcon from '@mui/icons-material/ArrowRightAlt';
import UndoIcon from '@mui/icons-material/Undo';
import NormalizeIcon from '../control/NormalizeIcon';
import { ISharedStrings, IWsAudioPlayerStrings } from '../model';
import { FaHandScissors, FaDotCircle, FaStopCircle } from 'react-icons/fa';
import type { IconBaseProps } from 'react-icons/lib';

import { MimeInfo, useMediaRecorder } from '../crud/useMediaRecorder';
import { IMarker, useWaveSurfer } from '../crud/useWaveSurfer';
import { Duration } from '../control/Duration';
import { GrowingSpacer } from '../control/GrowingSpacer';
import { LightTooltip } from '../control/LightTooltip';
import { useSnackBar } from '../hoc/SnackBar';
import { HotKeyContext } from '../context/HotKeyContext';
import WSAudioPlayerZoom, { maxZoom } from './WSAudioPlayerZoom';
import {
  dataPath,
  logError,
  PathType,
  Severity,
  useCheckOnline,
} from '../utils';
import {
  IRegion,
  IRegionChange,
  IRegionParams,
  parseRegionParams,
  parseRegions,
} from '../crud/useWavesurferRegions';
import WSAudioPlayerSegment from './WSAudioPlayerSegment';
import Confirm from './AlertDialog';
import { NamedRegions } from '../utils/namedSegments';
import { sharedSelector, wsAudioPlayerSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { AltButton } from '../control';
import { AudioAiFunc, useAudioAi } from '../utils/useAudioAi';
import { Exception } from '@orbit/core';
import { useGlobal } from '../context/GlobalContext';
import { AxiosError } from 'axios';
import { IFeatures } from './Team/TeamSettings';
import {
  orgDefaultFeatures,
  orgDefaultVoices,
  useOrgDefaults,
} from '../crud/useOrgDefaults';
import NoChickenIcon from '../control/NoChickenIcon';
import VcButton from '../control/ConfButton';
import VoiceConversionLogo from '../control/VoiceConversionLogo';
import BigDialog, { BigDialogBp } from '../hoc/BigDialog';
import { useVoiceUrl } from '../crud/useVoiceUrl';
import SelectVoice from '../business/voice/SelectVoice';
import { isElectron } from '../api-variable';
import WSAudioPlayerRate from './WSAudioPlayerRate';
const ipc = (window as any)?.electron;

const HandScissors = FaHandScissors as unknown as React.FC<IconBaseProps>;
const DotCircle = FaDotCircle as unknown as React.FC<IconBaseProps>;
const StopCircle = FaStopCircle as unknown as React.FC<IconBaseProps>;

const VertDivider = (prop: DividerProps) => (
  <Divider orientation="vertical" flexItem sx={{ ml: '5px' }} {...prop} />
);

const toolbarProp = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyItems: 'flex-start',
  display: 'flex',
} as SxProps;

interface IProps {
  id?: string;
  visible?: boolean;
  blob?: Blob;
  initialposition?: number;
  setInitialPosition?: (position: number | undefined) => void;
  allowRecord?: boolean;
  allowZoom?: boolean;
  allowSegment?: NamedRegions | undefined;
  allowAutoSegment?: boolean;
  allowSpeed?: boolean;
  allowDeltaVoice?: boolean;
  alternatePlayer?: boolean;
  oneTryOnly?: boolean;
  width: number;
  height: number;
  segments: string;
  verses?: string;
  currentSegmentIndex?: number;
  markers?: IMarker[];
  metaData?: JSX.Element;
  isPlaying?: boolean;
  regionOnly?: boolean;
  request?: Date;
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
  onStartRegion?: (position: number) => void;
  onBlobReady?: (blob: Blob | undefined) => void;
  setBlobReady?: (ready: boolean) => void;
  setChanged?: (changed: boolean) => void;
  onSaveProgress?: (progress: number) => void; //user initiated
  onDuration?: (duration: number) => void;
  onInteraction?: () => void;
  onRecording?: (r: boolean) => void;
  onCurrentSegment?: (currentSegment: IRegion | undefined) => void;
  onMarkerClick?: (time: number) => void;
  reload?: (blob: Blob) => void;
  noNewVoice?: boolean;
}

const PLAY_PAUSE_KEY = 'F1,CTRL+SPACE';
const ALT_PLAY_PAUSE_KEY = 'ALT+F1,ALT+CTRL+SPACE';
const HOME_KEY = 'CTRL+HOME';
const BACK_KEY = 'F2,CTRL+SHIFT+<';
const AHEAD_KEY = 'F3,CTRL+SHIFT+>';
const END_KEY = 'CTRL+END';
const TIMER_KEY = 'F6,CTRL+6';
const RECORD_KEY = 'F9,CTRL+9';
const LEFT_KEY = 'CTRL+ARROWLEFT';
const RIGHT_KEY = 'CTRL+ARROWRIGHT';

function WSAudioPlayer(props: IProps) {
  const {
    blob,
    initialposition,
    setInitialPosition,
    allowRecord,
    allowZoom,
    allowSegment,
    allowAutoSegment,
    allowSpeed,
    allowDeltaVoice,
    oneTryOnly,
    width,
    height,
    segments,
    verses,
    currentSegmentIndex,
    markers,
    metaData,
    isPlaying,
    regionOnly,
    request,
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
    onStartRegion,
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
    reload,
    noNewVoice,
  } = props;
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [org] = useGlobal('organization');
  const [features, setFeatures] = useState<IFeatures>();
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [voice, setVoice] = useState('');
  const voiceUrl = useVoiceUrl();
  const { getOrgDefault } = useOrgDefaults();
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
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [processMsg, setProcessMsg] = useState<string | undefined>(undefined);
  const readyRef = useRef(false);
  const [ready, setReadyx] = useState(false);
  const [progress, setProgress] = useState(0);
  const durationRef = useRef(0);
  const initialPosRef = useRef(initialposition);
  const segmentsRef = useRef(segments);
  const markersRef = useRef<IMarker[]>([]);
  const [duration, setDurationx] = useState(0);
  const justPlayButton = allowRecord;
  const [processingRecording, setProcessingRecordingx] = useState(false);
  const processRecordRef = useRef(false);
  const { showMessage } = useSnackBar();
  const [errorReporter] = useGlobal('errorReporter');
  const t: IWsAudioPlayerStrings = useSelector(
    wsAudioPlayerSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [style, setStyle] = useState({
    cursor: busy || loading ? 'progress' : 'default',
  });
  const autostartTimer = useRef<NodeJS.Timeout>();
  const onSaveProgressRef = useRef<(progress: number) => void | undefined>();
  const [oneShotUsed, setOneShotUsed] = useState(false);
  const cancelAIRef = useRef(false);
  const { requestAudioAi } = useAudioAi();
  const checkOnline = useCheckOnline(t.reduceNoise);
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const [pxPerSec, setPxPerSecx] = useState(maxZoom);
  const pxPerSecRef = useRef(maxZoom);

  const setPxPerSec = (px: number) => {
    pxPerSecRef.current = px;
    setPxPerSecx(px);
  };

  const onZoom = allowZoom
    ? (px: number) => {
        px = Math.round(px * 10) / 10;
        if (px !== pxPerSecRef.current) {
          setPxPerSec(px);
        }
      }
    : undefined;
  const {
    isReady,
    wsLoad,
    wsClear,
    wsTogglePlay,
    wsPlayRegion,
    wsBlob,
    wsRegionBlob,
    wsPause,
    wsDuration,
    wsPosition,
    wsSetPlaybackRate,
    wsSkip,
    wsGoto,
    wsLoadRegions,
    wsClearRegions,
    wsGetRegions,
    wsLoopRegion,
    wsRegionDelete,
    wsRegionReplace,
    wsUndo,
    wsInsertAudio,
    wsFillPx,
    wsZoom,
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
    waveformRef,
    onWSReady,
    onWSProgress,
    onWSRegion,
    onWSCanUndo,
    onWSPlayStatus,
    onInteraction,
    onZoom,
    onMarkerClick,
    () => {}, //on error...probably should report?
    height - 120,
    allowRecord,
    currentSegmentIndex,
    onCurrentSegment,
    onStartRegion,
    verses
  );

  //because we have to call hooks consistently, call this even if we aren't going to record
  const { startRecording, stopRecording, acceptedMimes } = useMediaRecorder(
    allowRecord,
    onRecordStart,
    onRecordStop,
    onRecordError,
    onRecordDataAvailable
  );

  const setProcessingRecording = (value: boolean) => {
    setProcessingRecordingx(value);
    processRecordRef.current = value;
  };
  //#region hotkey handlers
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
    console.log('handleRecorder');
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
      setProcessingRecording(true);
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

  const handleClearRegions = () => {
    wsClearRegions();
    if (verses) {
      segmentsRef.current = verses;
      loadRegions();
      onSegmentChange && onSegmentChange(verses);
    }
  };
  //#endregion

  const playerKeys = [
    {
      key: PLAY_PAUSE_KEY,
      cb: () => {
        togglePlayStatus();
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
        togglePlayStatus();
        return true;
      },
    },
  ];

  const recordKeys = [{ key: RECORD_KEY, cb: handleRecorder }];

  const segmentKeys = [
    { key: LEFT_KEY, cb: handlePrevRegion },
    { key: RIGHT_KEY, cb: handleNextRegion },
  ];
  const handleRefresh = () => {
    setVoice(getOrgDefault(orgDefaultVoices)?.fullName);
  };

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      playerKeys.forEach((k) => unsubscribe(k.key));
      simplePlayerKeys.forEach((k) => unsubscribe(k.key));
      recordKeys.forEach((k) => unsubscribe(k.key));
      segmentKeys.forEach((k) => unsubscribe(k.key));
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
    if (org) {
      setFeatures(getOrgDefault(orgDefaultFeatures));
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

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
    console.log('useEffect height, waitingForAI', height, waitingForAI);
    wsSetHeight(waitingForAI ? 0 : height - 120); //does this need to be smarter?
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, waitingForAI]);

  useEffect(() => {
    if (initialposition !== undefined) {
      if (isReady) wsGoto(initialposition);
      else initialPosRef.current = initialposition;
      setInitialPosition && setInitialPosition(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialposition, isReady]);

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

  const togglePlayStatus = () => {
    handlePlayStatus(!playingRef.current);
  };
  const handlePlayStatus = (play: boolean) => {
    if (durationRef.current === 0 || recordingRef.current) return false;
    var nowplaying = play;

    if (play && regionOnly) {
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
    if (isPlaying !== undefined) handlePlayStatus(isPlaying);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, request, duration]);

  function onRecordStart() {}

  async function onRecordStop(blob: Blob) {
    await wsInsertAudio(
      blob,
      recordStartPosition.current,
      recordOverwritePosition.current || recordStartPosition.current
    );
    recordOverwritePosition.current = undefined;
    setProcessingRecording(false);
    setReady(true);
    handleChanged();
  }

  function onRecordError(e: any) {
    setProcessingRecording(false);

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
      e?.type
    );
    recordOverwritePosition.current = newPos;
    setDuration(wsDuration());
    wsGoto(newPos || wsDuration());
  }
  function onWSReady() {
    setReady(true);
    setDuration(wsDuration());
    setPxPerSec(wsFillPx());

    if (segmentsRef.current?.length > 2) loadRegions();

    if (setBusy) setBusy(false);
    if (initialPosRef.current) wsGoto(initialPosRef.current);
    initialPosRef.current = undefined;
  }
  function onWSProgress(progress: number) {
    setProgress(progress);
    if (onProgress) onProgress(progress);
  }
  function onWSRegion(count: number, newRegion: boolean) {
    console.log('onWSRegion', count, newRegion);
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
  const doingProcess = (inprogress: boolean, msg?: string) => {
    setProcessMsg(msg ?? t.aiInProgress);
    setWaitingForAI(inprogress);
    setBusy && setBusy(inprogress);
    setBlobReady && setBlobReady(!inprogress);
  };
  const audioAiMsg = (
    func: AudioAiFunc,
    targetVoice?: string,
    error?: Error | AxiosError
  ) => {
    let msg =
      t.getString(`${func}Failed`) ??
      t.aiFailed
        .replace('{0}', targetVoice ? ` for ${targetVoice}` : '')
        .replace('{1}', func);
    if (error instanceof Error) {
      msg += ` ${error.message}`;
    }
    if (error instanceof AxiosError) {
      msg += ` ${error.response?.data}`;
    }
    return msg;
  };
  const applyAudioAi = (func: AudioAiFunc, targetVoice?: string) => {
    checkOnline((online) => {
      if (!online) {
        showMessage(ts.mustBeOnline);
        return;
      }
      if (!reload) throw new Exception('need reload defined.');
      cancelAIRef.current = false;
      try {
        doingProcess(true);
        const filename = `${Date.now()}ai.wav`;
        wsRegionBlob().then((blob) => {
          if (blob) {
            requestAudioAi({
              func,
              cancelRef: cancelAIRef,
              file: new File([blob], filename, { type: 'audio/wav' }),
              targetVoice,
              cb: (file: File | Error) => {
                if (file instanceof File) {
                  var regionblob = new Blob([file], { type: file.type });
                  if (regionblob) {
                    wsRegionReplace(regionblob).then((newblob) => {
                      if (newblob) reload(newblob);
                      setChanged && setChanged(true);
                    });
                  }
                } else {
                  if ((file as Error).message !== 'canceled') {
                    const msg = audioAiMsg(func, targetVoice, file);
                    showMessage(msg);
                    logError(Severity.error, errorReporter, msg);
                  }
                }
                doingProcess(false);
              },
            });
          } else {
            doingProcess(false);
          }
        });
      } catch (error: any) {
        const msg = audioAiMsg(func, targetVoice, error);
        logError(Severity.error, errorReporter, msg);
        showMessage(msg);
        doingProcess(false);
      }
    });
  };
  const handleNoiseRemoval = () => {
    applyAudioAi(AudioAiFunc.noiseRemoval);
  };
  const applyVoiceChange = () => {
    checkOnline(async (online) => {
      if (!online) {
        showMessage(ts.mustBeOnline);
        return;
      }
      if (!voice) return;
      const targetVoice = await voiceUrl(voice);
      if (targetVoice) {
        applyAudioAi(AudioAiFunc.voiceConversion, targetVoice);
        setVoiceVisible(false);
        showMessage(t.beginVoiceConvert);
      }
    });
  };
  const handleVoiceChange = () => {
    if (Boolean(voice)) {
      applyVoiceChange();
    } else {
      setVoiceVisible(true);
    }
  };
  const handleCloseVoice = () => {
    setVoiceVisible(false);
  };
  const handleVoiceSettings = () => {
    checkOnline((online) => {
      if (!online) {
        showMessage(ts.mustBeOnline);
        return;
      }
      setVoiceVisible(true);
    });
  };

  const handleNormal = async () => {
    if (!reload) throw new Exception('need reload defined.');

    try {
      doingProcess(true, t.normalizeInProgress);
      const fileBeg = await dataPath(`${Date.now()}b-norm.wav`, PathType.MEDIA);
      const fileEnd = await dataPath(`${Date.now()}e-norm.wav`, PathType.MEDIA);
      const blob = await wsRegionBlob();
      if (blob) {
        // write to local file system
        const arrayBuffer = await blob.arrayBuffer();
        console.log(arrayBuffer);
        const absMax = new Uint8Array(arrayBuffer).reduce(
          (a, b) => Math.max(a, Math.abs(b)),
          0
        );
        const min = new Uint8Array(arrayBuffer).reduce(
          (a, b) => Math.min(a, b),
          0
        );
        console.log('Abs Max: ', absMax, ' Min: ', min);
        if (absMax < 255) throw new Exception(t.tooQuiet);
        await ipc?.writeBuffer(fileBeg, arrayBuffer);
        await ipc?.normalize(fileBeg, fileEnd);
        const result = await ipc?.read(fileEnd);
        const regionblob = new Blob([result], { type: blob.type });
        const newblob = await wsRegionReplace(regionblob);
        if (newblob) reload(newblob);
        setChanged && setChanged(true);
        await ipc?.delete(fileBeg);
        await ipc?.delete(fileEnd);
      }
    } catch (error: any) {
      const msg = t.normalizeFail.replace('{0}', error.message);
      if (errorReporter) logError(Severity.error, errorReporter, msg);
      showMessage(msg);
    } finally {
      doingProcess(false);
    }
  };

  const onSplit = (split: IRegionChange) => {};

  const voiceConvertTip = useMemo(
    () =>
      (t.convertVoice + '\u00A0\u00A0').replace(
        '{0}',
        voice ? `\u2039 ${voice} \u203A` : ''
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [voice]
  );

  return (
    <Box sx={{ width: width }}>
      <Paper sx={{ p: 1, mb: 1 }}>
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
                              playing || processingRecording || waitingForAI
                            }
                          >
                            {recording ? <StopCircle /> : <DotCircle />}
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
                          onClick={togglePlayStatus}
                          disabled={duration === 0 || recording || waitingForAI}
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
                      // startBig={allowRecord || false}
                      ready={ready && !recording}
                      fillPx={wsFillPx()}
                      curPx={pxPerSec}
                      onZoom={wsZoom}
                    ></WSAudioPlayerZoom>
                  </Grid>
                  <VertDivider id="wsAudioDiv3" />
                </>
              )}
              {allowRecord && (
                <>
                  {features?.noNoise && !offline && (
                    <LightTooltip
                      id="noiseRemovalTip"
                      title={
                        <Badge badgeContent={ts.ai}>{t.reduceNoise}</Badge>
                      }
                    >
                      <span>
                        <IconButton
                          id="noiseRemoval"
                          onClick={handleNoiseRemoval}
                          disabled={
                            !ready ||
                            playing ||
                            recording ||
                            duration === 0 ||
                            waitingForAI
                          }
                        >
                          <NoChickenIcon
                            sx={{ width: '20pt', height: '20pt' }}
                            disabled={
                              !ready ||
                              playing ||
                              recording ||
                              duration === 0 ||
                              waitingForAI
                            }
                          />
                        </IconButton>
                      </span>
                    </LightTooltip>
                  )}
                  {features?.deltaVoice &&
                    allowDeltaVoice !== false &&
                    !offline && (
                      <LightTooltip
                        id="voiceChangeTip"
                        title={
                          <Badge badgeContent={ts.ai}>{voiceConvertTip}</Badge>
                        }
                      >
                        <span>
                          <VcButton
                            id="voiceChange"
                            onClick={handleVoiceChange}
                            onSettings={handleVoiceSettings}
                            disabled={
                              !ready ||
                              playing ||
                              recording ||
                              duration === 0 ||
                              waitingForAI
                            }
                            allowSettings={duration === 0}
                          >
                            <VoiceConversionLogo
                              sx={{
                                width: '18pt',
                                height: '18pt',
                              }}
                              disabled={
                                !ready ||
                                playing ||
                                recording ||
                                duration === 0 ||
                                waitingForAI
                              }
                            />
                          </VcButton>
                        </span>
                      </LightTooltip>
                    )}
                  {features?.normalize && isElectron && (
                    <LightTooltip title={t.normalize}>
                      <span>
                        <IconButton
                          id="normalize"
                          onClick={handleNormal}
                          disabled={
                            !ready ||
                            playing ||
                            recording ||
                            duration === 0 ||
                            waitingForAI
                          }
                        >
                          <NormalizeIcon
                            width={'20pt'}
                            height={'20pt'}
                            disabled={
                              !ready ||
                              playing ||
                              recording ||
                              duration === 0 ||
                              waitingForAI
                            }
                          />
                        </IconButton>
                      </span>
                    </LightTooltip>
                  )}
                  {hasRegion !== 0 && !oneShotUsed && (
                    <LightTooltip
                      id="wsAudioDeleteRegionTip"
                      title={t.deleteRegion}
                    >
                      <span>
                        <IconButton
                          id="wsAudioDeleteRegion"
                          onClick={handleDeleteRegion}
                          disabled={recording || waitingForAI}
                        >
                          <HandScissors />
                        </IconButton>
                      </span>
                    </LightTooltip>
                  )}
                  {canUndo && !oneShotUsed && (
                    <LightTooltip id="wsUndoTip" title={t.undoTip}>
                      <span>
                        <IconButton
                          id="wsUndo"
                          onClick={handleUndo}
                          disabled={recording || waitingForAI}
                        >
                          <UndoIcon />
                        </IconButton>
                      </span>
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
                          disabled={recording || duration === 0 || waitingForAI}
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
                  wsClearRegions={handleClearRegions}
                  setBusy={setBusy}
                />
              )}
              {waitingForAI && (
                <Grid container sx={{ pr: 6 }}>
                  <Grid item xs={12}>
                    <Typography sx={{ whiteSpace: 'normal' }}>
                      {processMsg}
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sx={{ display: 'flex', justifyContent: 'center' }}
                  >
                    <AltButton
                      id="ai-cancel"
                      onClick={() => {
                        cancelAIRef.current = true;
                        doingProcess(false);
                      }}
                    >
                      {ts.cancel}
                    </AltButton>
                  </Grid>
                </Grid>
              )}
            </Grid>
            <div
              id="wsAudioWaveform"
              ref={waveformRef}
              style={{ width: width - 16 }} //paper margin
            />
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
                          disabled={!hasRegion || waitingForAI}
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
                            disabled={!hasRegion || waitingForAI}
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
                            disabled={!hasRegion || waitingForAI}
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
                          onClick={togglePlayStatus}
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
                    <WSAudioPlayerRate
                      playbackRate={playbackRate}
                      setPlaybackRate={setPlaybackRate}
                      recording={recording}
                      localizeHotKey={localizeHotKey}
                    />
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
                jsx={
                  typeof confirmAction !== 'string' ? confirmAction : undefined
                }
                text={typeof confirmAction === 'string' ? confirmAction : ''}
                yesResponse={handleActionConfirmed}
                noResponse={handleActionRefused}
              />
            )}
            <BigDialog
              title={t.selectVoice}
              description={<Typography>{t.selectVoicePrompt}</Typography>}
              isOpen={voiceVisible}
              onOpen={handleCloseVoice}
              bp={BigDialogBp.sm}
            >
              <SelectVoice
                noNewVoice={noNewVoice && duration > 0}
                onlySettings={duration === 0}
                onOpen={handleCloseVoice}
                begin={applyVoiceChange}
                refresh={handleRefresh}
              />
            </BigDialog>
          </>
        </Box>
      </Paper>
    </Box>
  );
}

export default WSAudioPlayer;
