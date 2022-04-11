import { Button } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import { IRegion, parseRegions } from '../../crud/useWavesurferRegions';
import WSAudioPlayer from '../WSAudioPlayer';
import { useSelector, shallowEqual } from 'react-redux';
import { IWsAudioPlayerStrings } from '../../model';
import { playerSelector } from '../../selector';

interface IStateProps {}

interface IProps extends IStateProps {
  allowSegment?: boolean;
  saveSegments?: boolean;
}

export function PassageDetailPlayer(props: IProps) {
  const { allowSegment, saveSegments } = props;
  const { toolChanged, toolsChanged, isChanged, saveRequested, startSave } =
    useContext(UnsavedContext).state;
  const t: IWsAudioPlayerStrings = useSelector(playerSelector, shallowEqual);
  const toolId = 'ArtifactSegments';
  const ctx = useContext(PassageDetailContext);
  const [requestPlay, setRequestPlay] = useState<boolean | undefined>(
    undefined
  );
  const [initialposition, setInitialPosition] = useState<number | undefined>(0);
  const {
    loading,
    pdBusy,
    setPDBusy,
    audioBlob,
    setupLocate,
    playing,
    setPlaying,
    currentstep,
    playerSize,
    setCurrentSegment,
    discussionMarkers,
    highlightDiscussion,
    handleHighlightDiscussion,
  } = ctx.state;
  const highlightRef = useRef(highlightDiscussion);
  const defaultSegParams = {
    silenceThreshold: 0.004,
    timeThreshold: 0.12,
    segLenThreshold: 4.5,
  };
  const [defaultSegments, setDefaultSegments] = useState('{}');

  const segmentsRef = useRef('');
  const playingRef = useRef(playing);

  const setPlayerSegments = (segments: string) => {
    if (
      !allowSegment ||
      !segmentsRef.current ||
      segmentsRef.current.indexOf('},{') === -1
    )
      setDefaultSegments(segments);
    if (!playingRef.current) {
      var segs = parseRegions(segments);
      if (segs.regions.length > 0) {
        setInitialPosition(segs.regions[0].start);
        setRequestPlay(true);
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
          .findIndex((r: IRegion) => r.start === segment.start) + 1;
    }
    setCurrentSegment && setCurrentSegment(segment, index);
  };
  const onSegmentChange = (segments: string) => {
    segmentsRef.current = segments;
    setDefaultSegments(segments); //now we'll notice if we reset them in SetPlayerSegments
    if (saveSegments) {
      toolChanged(toolId);
    } else {
      //not saving segments...so don't update changed
    }
  };

  const onPlayStatus = (newPlaying: boolean) => {
    if (playingRef.current !== newPlaying) {
      setPlaying(newPlaying);
      playingRef.current = newPlaying;
      setRequestPlay(undefined);
      setInitialPosition(undefined);
    }
  };

  const onInteraction = () => {
    //focus on add comment?? focusOnTranscription();
  };

  useEffect(() => {
    highlightRef.current = highlightDiscussion;
  }, [highlightDiscussion]);

  useEffect(() => {
    if (playing !== playingRef.current) setRequestPlay(playing);
  }, [playing]);

  useEffect(() => {
    setupLocate(setPlayerSegments);
    return () => {
      setupLocate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep]);

  useEffect(() => {
    if (saveRequested(toolId)) handleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const handleSave = () => {
    if (!saveRequested(toolId)) {
      startSave(toolId);
    }
    //save the segments here
  };

  return (
    <div id="detailplayer">
      <WSAudioPlayer
        id="audioPlayer"
        allowRecord={false}
        size={playerSize}
        blob={audioBlob}
        initialposition={initialposition}
        isPlaying={requestPlay}
        loading={loading}
        busy={pdBusy}
        allowSegment={allowSegment}
        defaultRegionParams={defaultSegParams}
        segments={defaultSegments}
        markers={discussionMarkers}
        onMarkerClick={handleHighlightDiscussion}
        setBusy={setPDBusy}
        onSegmentChange={onSegmentChange}
        onPlayStatus={onPlayStatus}
        onInteraction={onInteraction}
        onCurrentSegment={onCurrentSegment}
        metaData={
          saveSegments ? (
            <Button
              id="segment-save"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={isChanged(toolId)}
            >
              {t.saveSegments}
            </Button>
          ) : (
            <></>
          )
        }
      />
    </div>
  );
}

export default PassageDetailPlayer as any;
