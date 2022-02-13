import { Button } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import { IRegion } from '../../crud/useWavesurferRegions';
import { IState } from '../../model';
import WSAudioPlayer from '../WSAudioPlayer';

interface IStateProps {}

interface IProps extends IStateProps {
  allowSegment?: boolean;
  saveSegments?: boolean;
}

export function PassageDetailPlayer(props: IProps) {
  const { allowSegment, saveSegments } = props;
  const { toolChanged, toolsChanged, isChanged, saveRequested, startSave } =
    useContext(UnsavedContext).state;
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
    console.log('index', index);
    setCurrentSegment && setCurrentSegment(segment, index);
  };
  const onSegmentChange = (segments: string) => {
    segmentsRef.current = segments;
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
              {'save segments'}
            </Button>
          ) : (
            <></>
          )
        }
      />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({});

export default connect(mapStateToProps)(PassageDetailPlayer) as any as any;
