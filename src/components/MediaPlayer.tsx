import React, { useRef, useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { logError, Severity } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  srcMediaId: string;
  requestPlay: boolean;
  onEnded: () => void;
  onTogglePlay?: () => void;
  onPosition?: (timeStamp: number) => void;
  position?: number;
  onDuration?: (timeStamp: number) => void;
  controls?: boolean;
}

export function MediaPlayer(props: IProps) {
  const {
    srcMediaId,
    requestPlay,
    onEnded,
    onTogglePlay,
    onPosition,
    position,
    onDuration,
    controls,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [ready, setReady] = useState(false);
  const timeTrack = useRef<number>();
  const { showMessage } = useSnackBar();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

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
    if (mediaState.id !== srcMediaId) return;
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
    setPosition(position);
  }, [position]);

  const ended = () => {
    if (audioRef.current) audioRef.current.currentTime = 0;
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
    if (!onPosition) return;
    const el = audioRef.current as HTMLMediaElement;
    const time = Math.round(el.currentTime * 10);
    if (time === timeTrack.current) return;
    timeTrack.current = time;
    onPosition(time / 10);
  };

  const durationChange = () => {
    setPosition(position);
    const el = audioRef.current as HTMLMediaElement;
    if (onDuration && el?.duration) onDuration(el.duration);
    timeTrack.current = undefined;
  };

  const handleError = (e: any) => {
    logError(Severity.error, reporter, e);
    // showMessage(e.target?.error?.message || ts.mediaError);
    showMessage(ts.mediaError);
  };

  return ready ? (
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
  ) : (
    <></>
  );
}
export default MediaPlayer;
