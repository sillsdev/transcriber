import React, { useRef, useState, useEffect } from 'react';
import Auth from '../auth/Auth';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { logError, Severity } from '../utils';

interface IProps {
  auth: Auth | null;
  srcMediaId: string;
  requestPlay: boolean;
  onEnded: () => void;
}

export function MediaPlayer(props: IProps) {
  const { auth, srcMediaId, requestPlay, onEnded } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<any>();
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [ready, setReady] = useState(false);
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
        audioRef.current.pause();
        setPlaying(false);
      }
    }
  }, [ready, requestPlay, playing, playItem]);

  const ended = () => {
    audioRef.current.currentTime = 0;
    if (onEnded) onEnded();
  };
  const handleError = (e: any) => {
    logError(Severity.error, reporter, e);
    showMessage(ts.mediaError);
  };
  return ready ? (
    <audio
      onEnded={ended}
      ref={audioRef}
      onError={handleError}
      src={mediaState.url}
    />
  ) : (
    <></>
  );
}
export default MediaPlayer;
