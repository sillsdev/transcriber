import { useEffect } from 'react';
import { getSegments } from '../../utils/namedSegments';
import { JSONParse } from '../../utils/jsonParse';
import { IRegion, parseRegions } from '../../crud/useWavesurferRegions';
import { MediaFile } from '../../model';

export interface RequestPlay {
  play: boolean | undefined;
  regionOnly: boolean;
  request: Date;
}
interface PlayerLogicProps {
  allowSegment?: string;
  suggestedSegments?: string;
  position?: number;
  playing?: boolean;
  setPlaying?: (playing: boolean) => void;
  setCurrentSegment?: (segment: IRegion | undefined, index: number) => void;
  setDefaultSegments: (segments: string) => void;
  setRequestPlay: (request: RequestPlay) => void;
  setInitialPosition: (position: number | undefined) => void;
  playerMediafile?: MediaFile;
  mediafileRef: React.MutableRefObject<MediaFile | undefined>;
  segmentsRef: React.MutableRefObject<string>;
  durationRef: React.MutableRefObject<number>;
  playingRef: React.MutableRefObject<boolean | undefined>;
  onSegment?: (segments: string, whole: boolean) => void;
}

export const usePlayerLogic = (props: PlayerLogicProps) => {
  const {
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
    onSegment,
  } = props;

  const loadSegments = () => {
    const segs = mediafileRef.current?.attributes?.segments || '{}';
    if (allowSegment) {
      segmentsRef.current = getSegments(allowSegment, segs);
      setSegmentToWhole();
    }
    setDefaultSegments(segmentsRef.current);
    onSegment && onSegment(segmentsRef.current, true);
  };

  useEffect(() => {
    //we need a ref for onDuration
    mediafileRef.current = playerMediafile;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerMediafile]);

  useEffect(() => {
    if (allowSegment)
      if (suggestedSegments) {
        segmentsRef.current = suggestedSegments;
        setDefaultSegments(segmentsRef.current);
        onSegment && onSegment(segmentsRef.current, true);
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
            (r: IRegion) => r.start <= segment?.start && r.end >= segment?.end
          ) + 1;
    } else {
      setSegmentToWhole();
      return;
    }
    setCurrentSegment && setCurrentSegment(segment, index);
  };

  const onPlayStatus = (newPlaying: boolean) => {
    if (playingRef.current !== newPlaying) {
      setPlaying && setPlaying(newPlaying);
      playingRef.current = newPlaying;
      setRequestPlay({
        play: undefined,
        regionOnly: false,
        request: new Date(),
      });
      setInitialPosition(undefined);
    }
  };

  useEffect(() => {
    if (playing !== playingRef.current)
      setRequestPlay({ play: playing, regionOnly: false, request: new Date() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    setInitialPosition(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  return { onPlayStatus, onCurrentSegment, setSegmentToWhole };
};
