import { useState, useRef } from 'react';

import { IRegion } from '../crud/useWavesurferRegions';
import WSAudioPlayer from './WSAudioPlayer';
import { MediaFile } from '../model';
import { NamedRegions } from '../utils/namedSegments';
import { usePlayerLogic } from '../business/player/usePlayerLogic';

export interface HiddenPlayerProps {
  allowSegment?: NamedRegions | undefined;
  suggestedSegments?: string;
  onProgress?: (progress: number) => void;
  onDuration?: (duration: number) => void;
  position?: number;
  loading?: boolean;
  audioBlob?: Blob;
  playing?: boolean;
  setPlaying?: (playing: boolean) => void;
  currentSegmentIndex?: number;
  currentSegment?: IRegion;
  setCurrentSegment?: (segment: IRegion | undefined, index: number) => void;
  playerMediafile?: MediaFile;
}

export function HiddenPlayer(props: HiddenPlayerProps) {
  const {
    allowSegment,
    suggestedSegments,
    onProgress,
    onDuration,
    position,
    loading,
    audioBlob,
    playing,
    setPlaying,
    currentSegmentIndex,
    setCurrentSegment,
    playerMediafile,
  } = props;

  const [requestPlay, setRequestPlay] = useState<{
    play: boolean | undefined;
    regionOnly: boolean;
  }>({ play: undefined, regionOnly: false });
  const [initialposition, setInitialPosition] = useState<number | undefined>(0);

  const [defaultSegments, setDefaultSegments] = useState('{}');
  const segmentsRef = useRef('');
  const playingRef = useRef(playing);
  const mediafileRef = useRef<MediaFile>();
  const durationRef = useRef(0);

  const { onPlayStatus, onCurrentSegment } = usePlayerLogic({
    allowSegment,
    suggestedSegments,
    position,
    playing,
    setPlaying,
    setCurrentSegment,
    playerMediafile,
    setDefaultSegments,
    setRequestPlay,
    setInitialPosition,
    mediafileRef,
    segmentsRef,
    durationRef,
    playingRef,
  });

  return (
    <div id="hiddenplayer">
      <WSAudioPlayer
        id="hiddenPlayer"
        allowRecord={false}
        size={150}
        blob={audioBlob}
        initialposition={initialposition}
        isPlaying={requestPlay.play}
        regionOnly={requestPlay.regionOnly}
        loading={loading}
        segments={defaultSegments}
        currentSegmentIndex={currentSegmentIndex}
        onPlayStatus={onPlayStatus}
        onCurrentSegment={onCurrentSegment}
        onProgress={onProgress}
        onDuration={onDuration}
      />
    </div>
  );
}

export default HiddenPlayer;
