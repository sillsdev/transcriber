import { useContext, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { IState } from '../../model';
import WSAudioPlayer from '../WSAudioPlayer';

interface IStateProps {}

interface IProps extends IStateProps {
  audioBlob: Blob;
}

export function PassageDetailPlayer(props: IProps) {
  const {
    loading,
    pdBusy,
    setPDBusy,
    audioBlob,
    setSegments,
    setupLocate,
    playing,
    setPlaying,
    currentstep,
    playerSize,
  } = useContext(PassageDetailContext).state;

  const playedSecsRef = useRef<number>(0);
  const [segments, setLocalSegments] = useState('{}');

  const setPlayerSegments = (segments: string) => {
    setLocalSegments(segments);
  };

  const onSegmentChange = (segments: string) => {
    setSegments(segments);
  };
  const onPlayStatus = (newPlaying: boolean) => {
    setPlaying(newPlaying);
  };
  const onProgress = (progress: number) => (playedSecsRef.current = progress);
  const onInteraction = () => {
    //focus on add comment?? focusOnTranscription();
  };

  useEffect(() => {
    setupLocate(setPlayerSegments);
    return () => {
      setupLocate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep]);

  return (
    <div>
      <WSAudioPlayer
        id="audioPlayer"
        allowRecord={false}
        size={playerSize}
        blob={audioBlob}
        initialposition={0}
        isPlaying={playing}
        loading={loading}
        busy={pdBusy}
        segments={segments}
        setBusy={setPDBusy}
        onProgress={onProgress}
        onSegmentChange={onSegmentChange}
        onPlayStatus={onPlayStatus}
        onInteraction={onInteraction}
      />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({});

export default connect(mapStateToProps)(PassageDetailPlayer) as any as any;
