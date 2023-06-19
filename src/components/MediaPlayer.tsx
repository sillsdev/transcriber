import React, { useRef, useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { logError, Severity } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import { IPeerCheckStrings, ISharedStrings } from '../model';
import { peerCheckSelector, sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { IconButton, Stack } from '@mui/material';
import { LightTooltip } from '../control/LightTooltip';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipPrevious from '@mui/icons-material/SkipPrevious';
import SkipNext from '@mui/icons-material/SkipNext';

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
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [ready, setReady] = useState(false);
  const timeTrack = useRef<number>();
  const [duration, setDuration] = useState(0);
  const stop = useRef<number>(0);
  const { showMessage } = useSnackBar();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IPeerCheckStrings = useSelector(peerCheckSelector, shallowEqual);

  useEffect(() => {
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlaying(false);
    }
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
      setPlaying(true);
      audioRef.current.play();
    } else if (!requestPlay) {
      if (playing) {
        if (audioRef.current) audioRef.current.pause();
        setPlaying(false);
      }
    }
  }, [ready, requestPlay, playing, playItem]);

  const setPosition = (position: number | undefined) => {
    if (audioRef.current && position !== undefined)
      audioRef.current.currentTime = position;
  };

  useEffect(() => {
    setPosition(limits?.start);
  }, [limits?.start]);

  const ended = () => {
    if (audioRef.current) audioRef.current.currentTime = limits?.start ?? 0;
    setPlaying(false);
    if (onEnded) onEnded();
  };

  const pause = () => {
    toggle(false);
  };
  const play = () => {
    toggle(true);
  };
  const toggle = (play: boolean) => {
    if (play !== playing && onTogglePlay) onTogglePlay();
  };

  const timeUpdate = () => {
    if (!Boolean(limits?.end)) return;
    const el = audioRef.current as HTMLMediaElement;
    const time = Math.round(el.currentTime * 10);
    if (stop.current !== 0 && time >= stop.current) {
      el.pause();
      ended();
    }
    if (time === timeTrack.current) return;
    timeTrack.current = time;
  };

  const durationChange = () => {
    if (limits?.end) {
      setPosition(limits?.start);
      stop.current = Math.round(limits?.end * 10);
    }
    const el = audioRef.current as HTMLMediaElement;
    if (el?.duration) setDuration(el.duration);
    timeTrack.current = undefined;
    onLoaded && onLoaded();
  };

  const handleError = (e: any) => {
    logError(Severity.error, reporter, e);
    // showMessage(e.target?.error?.message || ts.mediaError);
    showMessage(ts.mediaError);
  };

  const handleSegmentStart = () => {
    if (limits?.end) {
      setPosition(limits?.start);
      stop.current = Math.round((limits?.end ?? 0) * 10);
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

  return ready ? (
    <Stack direction="row" sx={{ width: '100%' }}>
      {controls && Boolean(limits?.end) ? (
        <>
          <LightTooltip title={t.resourceStart}>
            <IconButton
              data-testid="segment-start"
              sx={{ height: '54px', alignSelf: 'center' }}
              onClick={handleSegmentStart}
            >
              <SkipPrevious fontSize="small" />
            </IconButton>
          </LightTooltip>
          <LightTooltip title={t.back3Seconds}>
            <IconButton
              data-testid="skip-back"
              sx={{ height: '54px', alignSelf: 'center' }}
              onClick={handleSkipBack}
            >
              <ReplayIcon fontSize="small" />
            </IconButton>
          </LightTooltip>
        </>
      ) : (
        <></>
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
      {controls && limits?.end && duration && limits?.end < duration ? (
        <LightTooltip title={t.afterResource}>
          <IconButton
            data-testid="skip-next"
            sx={{ height: '54px', alignSelf: 'center' }}
            onClick={handleSkipNext}
          >
            <SkipNext fontSize="small" />
          </IconButton>
        </LightTooltip>
      ) : (
        <></>
      )}
    </Stack>
  ) : (
    <></>
  );
}
export default MediaPlayer;
