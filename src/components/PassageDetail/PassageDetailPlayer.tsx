import { Button } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import { IRegion } from '../../crud/useWavesurferRegions';
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
  } = useContext(PassageDetailContext).state;
  const defaultSegParams = {
    silenceThreshold: 0.004,
    timeThreshold: 0.12,
    segLenThreshold: 4.5,
  };
  const [defaultSegments, setDefaultSegments] = useState('{}');
  const segmentsRef = useRef('');

  const setPlayerSegments = (segments: string) => {
    setDefaultSegments(segments);
  };

  const onCurrentSegment = (segment: IRegion | undefined) => {
    var index = 0;
    if (segment && segmentsRef.current) {
      var segs = JSON.parse(segmentsRef.current);
      if (segs.regions) segs.regions = JSON.parse(segs.regions);
      else segs.regions = [];
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
    setPlaying(newPlaying);
  };

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
        allowSegment={allowSegment}
        defaultRegionParams={defaultSegParams}
        segments={defaultSegments}
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
