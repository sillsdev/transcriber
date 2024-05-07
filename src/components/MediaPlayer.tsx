import { useRef, useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { logError, Severity } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import { IPeerCheckStrings, ISharedStrings } from '../model';
import { peerCheckSelector, sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Chip,
  ChipProps,
  IconButton,
  Slider,
  Stack,
  StackProps,
  SxProps,
  TooltipProps,
  styled,
} from '@mui/material';
import { LightTooltip } from '../control/LightTooltip';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipPrevious from '@mui/icons-material/SkipPrevious';
import SkipNext from '@mui/icons-material/SkipNext';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import SpeedMenu from '../control/SpeedMenu';
import { Duration } from '../control/Duration';

const StyledChip = styled(Chip)<ChipProps>(({ theme }) => ({
  height: 'auto',
  '&>*': {
    padding: '4px!important',
    margin: '4px!important',
  },
  '& .MuiChip-label': {
    width: 'calc(100% - 20px)',
  },
  '& .MuiChip-deleteIcon': {
    color: theme.palette.action.active,
  },
}));

const StyledTip = styled(LightTooltip)<TooltipProps>(({ theme }) => ({
  backgroundColor: 'transparent',
}));

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  width: '100%',
  '& audio': {
    width: '100%',
  },
}));

interface IMediaLimits {
  start?: number;
  end?: number;
}

interface IProps {
  srcMediaId: string;
  requestPlay: boolean;
  onEnded: () => void;
  onTogglePlay?: () => void;
  controls?: boolean;
  limits?: IMediaLimits;
  onLoaded?: () => void;
  sx?: SxProps;
}

export function MediaPlayer(props: IProps) {
  const {
    srcMediaId,
    requestPlay,
    onLoaded,
    onEnded,
    onTogglePlay,
    controls,
    limits,
    sx,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playSuccess = useRef(false);
  const [value, setValue] = useState(0);
  const [playing, setPlayingx] = useState(false);
  const playingRef = useRef(false);
  const [playItem, setPlayItem] = useState('');
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationSet = useRef(false);
  const [speed, setSpeed] = useState(1);
  const timeTracker = useRef<number>(0);
  const stop = useRef<number>(0);
  const { showMessage } = useSnackBar();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IPeerCheckStrings = useSelector(peerCheckSelector, shallowEqual);

  const setPlaying = (x: boolean) => {
    setPlayingx(x);
    playingRef.current = x;
  };
  useEffect(() => {
    if (playingRef.current) {
      if (audioRef.current) {
        if (playSuccess.current) audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopPlay();
    }
    durationSet.current = false;
    if (srcMediaId !== playItem) {
      setReady(false);
      fetchMediaUrl({ id: srcMediaId });
      setPlayItem(srcMediaId);
    } else {
      durationChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
    if (mediaState.id !== srcMediaId && mediaState.remoteId !== srcMediaId)
      return;
    if (mediaState.status === MediaSt.FETCHED) setReady(true);
    if (mediaState.error) {
      if (mediaState.error.startsWith('no offline file'))
        showMessage(ts.fileNotFound);
      else showMessage(mediaState.error);
      onEnded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState]);

  useEffect(() => {
    if (ready && audioRef.current && playItem !== '' && requestPlay) {
      startPlay();
    } else if (!requestPlay) {
      if (playingRef.current) {
        if (audioRef.current && playSuccess.current) audioRef.current.pause();
        stopPlay();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, requestPlay, playing, playItem]);

  const setPosition = (position: number | undefined) => {
    if (
      audioRef.current &&
      position !== undefined &&
      position !== audioRef.current.currentTime
    ) {
      audioRef.current.currentTime = position;
    }
  };

  useEffect(() => {
    setPosition(limits?.start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits?.start]);

  const ended = () => {
    if (audioRef.current) audioRef.current.currentTime = limits?.start ?? 0;
    stopPlay();
    if (onEnded) onEnded();
  };

  const pause = () => {
    toggle(false);
  };
  const play = () => {
    toggle(true);
  };
  const toggle = (play: boolean) => {
    if (play !== playingRef.current && onTogglePlay) onTogglePlay();
  };

  const timeUpdate = () => {
    if (!Boolean(limits?.end)) return;
    const el = audioRef.current as HTMLMediaElement;
    const time = Math.round(el.currentTime * 1000) / 1000;
    if (stop.current !== 0 && time >= stop.current) {
      el.pause();
      ended();
    }
    const start = limits?.start ?? 0;
    const current = Math.round(
      ((time - start) / ((limits?.end ?? 0) - start)) * 100
    );
    if (timeTracker.current !== current) {
      timeTracker.current = current;
      setValue(current);
    }
  };

  const durationChange = () => {
    //this is called multiple times for some files
    const el = audioRef.current as HTMLMediaElement;
    if (!durationSet.current && el?.duration) {
      if (limits?.end) {
        setPosition(limits?.start);
        if (limits?.end > el.duration - 0.5) stop.current = 0;
        else stop.current = limits?.end + 0.25;
      }
      durationSet.current = true;
      setDuration(el.duration);
      onLoaded && onLoaded();
    }
  };

  const handleError = (e: any) => {
    logError(Severity.error, reporter, e);
    // showMessage(e.target?.error?.message || ts.mediaError);
    showMessage(ts.mediaError);
  };

  const handleSegmentStart = () => {
    setPosition(limits?.start ?? 0);
    if (limits?.end) {
      stop.current = limits?.end + 0.25;
    }
  };

  const handleSkipBack = () => {
    if (audioRef.current)
      setPosition(Math.max(audioRef.current?.currentTime - 3, 0));
  };

  const handleSkipNext = () => {
    if (audioRef.current) setPosition(limits?.end);
    stop.current = 0;
  };

  const startPlay = () => {
    if (playing || playSuccess.current) return;
    setPlaying(true);
    playSuccess.current = false;
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          playSuccess.current = true;
        })
        .catch(() => {
          playSuccess.current = false;
        });
    }
  };
  const stopPlay = () => {
    setPlaying(false);
    playSuccess.current = false;
  };
  const handlePlayPause = async () => {
    if (audioRef.current) {
      if (playingRef.current) {
        if (playSuccess.current) audioRef.current.pause();
      } else startPlay();
    }
  };

  const handleSliderChange = (e: Event, value: number | number[]) => {
    const el = audioRef.current as HTMLMediaElement;
    const curValue = Array.isArray(value) ? value[0] : value;
    const percent = curValue / 100;
    const start = limits?.start ?? 0;
    const duration = (limits?.end ?? 0) - start;
    const time = duration * percent + start;
    el.currentTime = time;
    timeTracker.current = Math.round((time - start) / duration);
    setValue(timeTracker.current);
  };

  return ready && limits?.end ? (
    <>
      {!controls ? (
        <></>
      ) : (
        <StyledChip
          icon={
            <>
              <StyledTip title={t.resourceStart}>
                <IconButton
                  data-testid="segment-start"
                  sx={{ alignSelf: 'center' }}
                  onClick={handleSegmentStart}
                >
                  <SkipPrevious fontSize="small" />
                </IconButton>
              </StyledTip>
              <StyledTip title={t.back3Seconds}>
                <IconButton
                  data-testid="skip-back"
                  sx={{ alignSelf: 'center' }}
                  onClick={handleSkipBack}
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </StyledTip>
              <IconButton
                data-testid="play-pause"
                sx={{ alignSelf: 'center', color: 'text.primary' }}
                onClick={handlePlayPause}
              >
                {playing ? (
                  <Pause fontSize="small" />
                ) : (
                  <PlayArrow fontSize="small" />
                )}
              </IconButton>
              <Duration
                seconds={
                  (audioRef.current?.currentTime ?? 0) - (limits?.start ?? 0)
                }
              />
              {' / '}
              <Duration seconds={(limits?.end ?? 0) - (limits?.start ?? 0)} />
            </>
          }
          label={
            <Stack direction="row" sx={{ px: 1 }}>
              <Slider
                value={value}
                onChange={handleSliderChange}
                size="small"
                sx={{ color: 'text.secondary' }}
              />
            </Stack>
          }
          deleteIcon={
            duration && limits?.end < duration ? (
              <>
                <StyledTip title={t.afterResource}>
                  <IconButton
                    data-testid="skip-next"
                    sx={{ alignSelf: 'center' }}
                    onClick={handleSkipNext}
                  >
                    <SkipNext fontSize="small" />
                  </IconButton>
                </StyledTip>
                <SpeedMenu
                  speed={speed}
                  onSpeed={(speed: number) => {
                    const el = audioRef.current as any; // playbackRate is new
                    if (el) el.playbackRate = speed;
                    setSpeed(speed);
                  }}
                />
              </>
            ) : (
              <></>
            )
          }
          onDelete={handleSkipNext}
          sx={{ ...sx, width: '100%' }}
        />
      )}
      <audio
        onEnded={ended}
        ref={audioRef}
        src={mediaState.url}
        onTimeUpdate={timeUpdate}
        onDurationChange={durationChange}
        onError={handleError}
        onPause={pause}
        onPlay={play}
      />
    </>
  ) : ready ? (
    <StyledStack direction="row" sx={{ ...sx }}>
      {controls && (
        <>
          <StyledTip title={t.resourceStart}>
            <IconButton
              data-testid="segment-start"
              sx={{ alignSelf: 'center' }}
              onClick={handleSegmentStart}
            >
              <SkipPrevious fontSize="small" />
            </IconButton>
          </StyledTip>
          <StyledTip title={t.back3Seconds}>
            <IconButton
              data-testid="skip-back"
              sx={{ alignSelf: 'center' }}
              onClick={handleSkipBack}
            >
              <ReplayIcon fontSize="small" />
            </IconButton>
          </StyledTip>
        </>
      )}
      <audio
        controls={controls}
        onEnded={ended}
        ref={audioRef}
        src={mediaState.url}
        onTimeUpdate={timeUpdate}
        onDurationChange={durationChange}
        onError={handleError}
        onPause={pause}
        onPlay={play}
      />
    </StyledStack>
  ) : (
    <></>
  );
}
export default MediaPlayer;
