import React, { useRef, useState, useEffect } from 'react';
import Auth from '../auth/Auth';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { logError, Severity } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  auth: Auth | null;
  srcMediaId: string;
  requestPlay: boolean;
  onEnded: () => void;
  onPosition?: (timeStamp: number) => void;
  position?: number;
  onDuration?: (timeStamp: number) => void;
}

export function ControledPlayer(props: IProps) {
  const {
    auth,
    srcMediaId,
    requestPlay,
    onEnded,
    onPosition,
    position,
    onDuration,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<HTMLAudioElement>();
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
    }
    setPlaying(false);
    if (srcMediaId !== playItem) {
      setReady(false);
      fetchMediaUrl({ id: srcMediaId, auth });
    }
    setPlayItem(srcMediaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
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

  useEffect(() => {
    if (audioRef.current && position) audioRef.current.currentTime = position;
  }, [position]);

  const ended = () => {
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (onEnded) onEnded();
  };

  const timeUpdate = () => {
    const el = audioRef.current as HTMLMediaElement;
    const time = Math.round(el.currentTime * 10);
    if (time === timeTrack.current) return;
    timeTrack.current = time;
    if (onPosition) onPosition(time / 10);
  };

  const durationChange = () => {
    const el = audioRef.current as HTMLMediaElement;
    if (onDuration) onDuration(el.duration);
    timeTrack.current = undefined;
  };

  const handleError = (e: any) => {
    logError(Severity.error, reporter, e);
    console.log(e);
    showMessage(e.target?.error?.message || ts.mediaError);
  };

  return ready ? (
    <audio
      onEnded={ended}
      ref={audioRef as any}
      src={mediaState.url}
      onTimeUpdate={timeUpdate}
      onDurationChange={durationChange}
      onError={handleError}
    />
  ) : (
    <></>
  );
}
export default ControledPlayer as any;
