import React, { useRef, useState, useEffect } from 'react';
import Auth from '../auth/Auth';
import { IState } from '../model';
import { connect } from 'react-redux';
import * as actions from '../store';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';

interface IStateProps {
  hasUrl: boolean;
  mediaUrl: string;
  trackedTask: string;
}
const mapStateToProps = (state: IState): IStateProps => ({
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
  trackedTask: state.media.trackedTask,
});
interface IDispatchProps {
  fetchMediaUrl: typeof actions.fetchMediaUrl;
}

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchMediaUrl: actions.fetchMediaUrl,
    },
    dispatch
  ),
});

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  onEnded: () => void;
}
interface IProps
  extends IStateProps,
    //  IRecordProps,
    IDispatchProps {
  auth: Auth;
  srcMediaId: string;
}

export function MediaPlayer(props: IProps) {
  const { hasUrl, mediaUrl, fetchMediaUrl, auth, srcMediaId, onEnded } = props;
  const audioRef = useRef<any>();
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('none');
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');

  useEffect(() => {
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    setPlaying(false);
    if (srcMediaId !== playItem) {
      fetchMediaUrl(srcMediaId, memory, offline, auth);
    }
    setPlayItem(srcMediaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
    if (hasUrl && audioRef.current && !playing && playItem !== '') {
      setPlaying(true);
      audioRef.current.play();
    }
  }, [hasUrl, playing, playItem]);
  const ended = () => {
    if (onEnded) onEnded();
  };
  return hasUrl ? (
    <audio onEnded={ended} ref={audioRef} src={mediaUrl} />
  ) : (
    <></>
  );
}
export default connect(mapStateToProps, mapDispatchToProps)(MediaPlayer) as any;
