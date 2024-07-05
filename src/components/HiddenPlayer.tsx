import { useState, useRef, useEffect } from 'react';

import { IRegion, parseRegions } from '../crud/useWavesurferRegions';
import WSAudioPlayer from './WSAudioPlayer';
import { MediaFile } from '../model';
import { JSONParse } from '../utils/jsonParse';
import { NamedRegions, getSegments } from '../utils/namedSegments';

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

  const loadSegments = () => {
    const segs = mediafileRef.current?.attributes?.segments || '{}';
    if (allowSegment) {
      segmentsRef.current = getSegments(allowSegment, segs);
      setSegmentToWhole();
    }
    setDefaultSegments(segmentsRef.current);
  };

  useEffect(() => {
    //we need a ref for onDuration
    mediafileRef.current = playerMediafile;
  }, [playerMediafile]);

  useEffect(() => {
    if (allowSegment)
      if (suggestedSegments) {
        segmentsRef.current = suggestedSegments;
        setDefaultSegments(segmentsRef.current);
      } else setSegmentToWhole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSegment, suggestedSegments]);

  useEffect(() => {
    if (allowSegment) loadSegments();
    else setDefaultSegments('{}');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSegment, playerMediafile]);

  const setSegmentToWhole = () => {
    if (allowSegment && setCurrentSegment && durationRef.current) {
      var segs = JSONParse(segmentsRef.current);
      //might be "[]"
      if ((segs.regions?.length ?? 0) < 3) {
        setCurrentSegment({ start: 0, end: durationRef.current }, -1);
      }
    }
  };

  const onCurrentSegment = (segment: IRegion | undefined) => {
    var index = 0;
    if (segment && segmentsRef.current) {
      var segs = parseRegions(segmentsRef.current);
      index =
        segs.regions
          .sort((a: IRegion, b: IRegion) => a.start - b.start)
          .findIndex(
            (r: IRegion) => r.start <= segment.start && r.end >= segment.end
          ) + 1;
    }
    setCurrentSegment && setCurrentSegment(segment, index);
  };

  const onPlayStatus = (newPlaying: boolean) => {
    if (playingRef.current !== newPlaying) {
      setPlaying && setPlaying(newPlaying);
      playingRef.current = newPlaying;
      setRequestPlay({ play: undefined, regionOnly: false });
      setInitialPosition(undefined);
    }
  };

  useEffect(() => {
    if (playing !== playingRef.current)
      setRequestPlay({ play: playing, regionOnly: false });
  }, [playing]);

  useEffect(() => {
    setInitialPosition(position);
  }, [position]);

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
