import React, { useRef, useState, useEffect } from 'react';
import Auth from '../auth/Auth';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';

interface IProps {
  auth: Auth;
  srcMediaId: string;
  onEnded: () => void;
}

export function MediaPlayer(props: IProps) {
  const { auth, srcMediaId, onEnded } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<any>();
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');

  useEffect(() => {
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    setPlaying(false);
    if (srcMediaId !== playItem) {
      fetchMediaUrl({ id: srcMediaId, auth });
    }
    setPlayItem(srcMediaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
    if (
      mediaState.status === MediaSt.FETCHED &&
      audioRef.current &&
      !playing &&
      playItem !== ''
    ) {
      setPlaying(true);
      audioRef.current.play();
    }
  }, [mediaState.status, playing, playItem]);
  const ended = () => {
    if (onEnded) onEnded();
  };
  return mediaState.status === MediaSt.FETCHED ? (
    <audio onEnded={ended} ref={audioRef} src={mediaState.url} />
  ) : (
    <></>
  );
}
export default MediaPlayer;
