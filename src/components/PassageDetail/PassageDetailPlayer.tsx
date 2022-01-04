import { useContext, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IState } from '../../model';
import WSAudioPlayer from '../WSAudioPlayer';

interface IStateProps {}

interface IProps extends IStateProps {
  audioBlob: Blob;
}
const INIT_PLAYER_HEIGHT = 280;

export function PassageDetailPlayer(props: IProps) {
  const { loading, pdBusy, setPDBusy, audioBlob, setSegments, segments } =
    usePassageDetailContext();

  const { playing, setPlaying } = useContext(PassageDetailContext).state;

  const [playerSize] = useState(INIT_PLAYER_HEIGHT);
  const playedSecsRef = useRef<number>(0);

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
