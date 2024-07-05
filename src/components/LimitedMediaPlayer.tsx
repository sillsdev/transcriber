import { useRef, useState, useEffect } from 'react';
import { IPeerCheckStrings } from '../model';
import { peerCheckSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Chip,
  ChipProps,
  IconButton,
  Slider,
  Stack,
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
import { Duration } from '../control/Duration';
import HiddenPlayer from './HiddenPlayer';
import { BlobStatus, useFetchMediaBlob } from '../crud/useFetchMediaBlob';

const StyledDiv = styled('div')({
  '& #hiddenplayer': {
    display: 'none',
  },
});

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
  limits: IMediaLimits;
  onLoaded?: () => void;
  sx?: SxProps;
}

export function LimitedMediaPlayer(props: IProps) {
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
  const [value, setValue] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlayingx] = useState(false);
  const playingRef = useRef(false);
  const [blobState, fetchBlob] = useFetchMediaBlob();
  const [duration, setDuration] = useState(0);
  const durationSet = useRef(false);
  const timeTracker = useRef<number>(0);
  const stop = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState(0);
  const t: IPeerCheckStrings = useSelector(peerCheckSelector, shallowEqual);

  const setPlaying = (play: boolean) => {
    setPlayingx(play);
    playingRef.current = play;
    if (!play && value === 0) {
      ended();
    }
  };

  const startPlay = () => {
    if (playingRef.current) return;
    setPlaying(true);
  };

  const stopPlay = () => {
    if (!playingRef.current) return;
    setPlaying(false);
  };

  const resetPlay = () => {
    stopPlay();
    setCurrentTime(limits?.start ?? 0);
    timeTracker.current = 0;
    setValue(0);
  };

  useEffect(() => {
    if (playingRef.current) {
      resetPlay();
    }
    if (srcMediaId !== blobState?.id) {
      if (ready) setReady(false);
      fetchBlob(srcMediaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
    stopPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobState.id]);

  useEffect(() => {
    if (blobState.blobStat === BlobStatus.FETCHED) {
      if (!ready) setReady(true);
      onLoaded && onLoaded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobState]);

  useEffect(() => {
    if (ready && requestPlay) {
      startPlay();
    } else if (!requestPlay) {
      stopPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, requestPlay]);

  const setPosition = (position: number | undefined) => {
    if (position !== undefined && position !== currentTime) {
      setCurrentTime(position);
    }
  };

  useEffect(() => {
    setPosition(limits.start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.start]);

  const handlePlayPause = () => {
    if (onTogglePlay) onTogglePlay();
    if (playingRef.current) {
      stopPlay();
    } else {
      startPlay();
    }
  };

  const ended = () => {
    resetPlay();
    if (onEnded) onEnded();
  };

  const timeUpdate = (progress: number) => {
    if (!Boolean(limits.start) && !Boolean(limits.end)) return;
    const time = Math.round(progress * 1000) / 1000;
    if (
      (stop.current !== 0 && time >= stop.current) ||
      (time === 0 && limits.start !== 0)
    ) {
      ended();
    }
    const start = limits.start ?? 0;
    const current = Math.round(
      ((time - start) / ((limits.end ?? 0) - start)) * 100
    );
    if (timeTracker.current !== current && playingRef.current) {
      timeTracker.current = current;
      setValue(current);
      setCurrentTime(time);
    }
  };

  const durationChange = (duration: number) => {
    //this is called multiple times for some files
    if (!durationSet.current && duration) {
      if (limits.end) {
        setPosition(limits.start);
        if (limits.end > duration - 0.5) stop.current = 0;
        else stop.current = limits.end + 0.25;
      }
      durationSet.current = true;
      setDuration(duration);
    }
  };

  const handleSegmentStart = () => {
    setPosition(limits.start ?? 0);
    if (limits.end) {
      stop.current = limits.end + 0.25;
    }
    setValue(0);
  };

  const handleSkipBack = () => {
    const newPos = Math.max(currentTime - 3, 0);
    setPosition(newPos);
    const start = limits.start ?? 0;
    const duration = (limits.end ?? 0) - start;
    const slider = Math.round(((newPos - start) * 100) / duration);
    setValue(slider);
  };

  const handleSkipNext = () => {
    setPosition(limits.end);
    stop.current = 0;
    setValue(100);
  };

  const handleSliderChange = (e: Event, value: number | number[]) => {
    const curValue = Array.isArray(value) ? value[0] : value;
    const percent = curValue / 100;
    const start = limits.start ?? 0;
    const duration = (limits.end ?? 0) - start;
    const time = duration * percent + start;
    setCurrentTime(time);
    timeTracker.current = time;
    setValue(curValue);
  };

  return ready ? (
    <StyledDiv id="limitedplayer">
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
              <Duration seconds={(currentTime ?? 0) - (limits.start ?? 0)} />
              {' / '}
              <Duration seconds={(limits.end ?? 0) - (limits.start ?? 0)} />
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
            duration && (limits.end ?? 0) < duration ? (
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
              </>
            ) : (
              <></>
            )
          }
          onDelete={handleSkipNext}
          sx={{ ...sx, width: '100%' }}
        />
      )}
      <HiddenPlayer
        onProgress={timeUpdate}
        onDuration={durationChange}
        position={currentTime}
        loading={blobState.blobStat === BlobStatus.PENDING}
        audioBlob={blobState.blob}
        playing={playing}
        setPlaying={setPlaying}
      />
    </StyledDiv>
  ) : (
    <></>
  );
}
export default LimitedMediaPlayer;
