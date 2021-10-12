import React, { useRef, useState, useEffect } from 'react';
import Auth from '../auth/Auth';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { ISharedStrings, IState } from '../model';
import localStrings from '../selector/localize';
import { connect } from 'react-redux';

interface IStateProps {
  ts: ISharedStrings;
}
interface IProps extends IStateProps {
  auth: Auth | null;
  srcMediaId: string;
  onEnded: () => void;
}

export function MediaPlayer(props: IProps) {
  const { auth, srcMediaId, onEnded, ts } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<any>();
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [ready, setReady] = useState(false);
  const { showMessage } = useSnackBar();

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
    if (ready && audioRef.current && !playing && playItem !== '') {
      setPlaying(true);
      audioRef.current.play();
    }
  }, [ready, playing, playItem]);

  const ended = () => {
    if (onEnded) onEnded();
  };
  return ready ? (
    <audio onEnded={ended} ref={audioRef} src={mediaState.url} />
  ) : (
    <></>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});
export default connect(mapStateToProps)(MediaPlayer) as any;
