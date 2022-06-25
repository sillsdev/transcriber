import { useGlobal } from 'reactn';
import { Button } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import { IRegion, parseRegions } from '../../crud/useWavesurferRegions';
import WSAudioPlayer from '../WSAudioPlayer';
import { useSelector, shallowEqual } from 'react-redux';
import { IWsAudioPlayerStrings, MediaFile } from '../../model';
import { UpdateRecord } from '../../model/baseModel';
import { playerSelector } from '../../selector';
import { NamedRegions, getSegments, updateSegments } from '../../utils';
import { findRecord } from '../../crud';

interface IStateProps {}

interface IProps extends IStateProps {
  allowSegment?: boolean;
  saveSegments?: boolean;
  allowAutoSegment?: boolean;
  onSegment?: (segment: string) => void;
}

export function PassageDetailPlayer(props: IProps) {
  const { allowSegment, allowAutoSegment, saveSegments, onSegment } = props;
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const {
    toolChanged,
    toolsChanged,
    isChanged,
    saveRequested,
    startSave,
    saveCompleted,
  } = useContext(UnsavedContext).state;
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
    selected,
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
  const savingRef = useRef(false);

  const loadSegments = () => {
    const mediafile = findRecord(memory, 'mediafile', selected) as
      | MediaFile
      | undefined;
    const segs = mediafile?.attributes?.segments || '{}';
    segmentsRef.current = getSegments(NamedRegions.BackTranslation, segs);
    setDefaultSegments(segmentsRef.current);
  };

  useEffect(() => {
    console.log('ctx loadSegments');
    loadSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const writeSegments = async () => {
    if (!savingRef.current) {
      savingRef.current = true;
      const mediafile = findRecord(memory, 'mediafile', selected) as
        | MediaFile
        | undefined;
      if (mediafile) {
        await memory
          .update((t) => [
            ...UpdateRecord(
              t,
              {
                type: 'mediafile',
                id: mediafile.id,
                attributes: {
                  segments: updateSegments(
                    NamedRegions.BackTranslation,
                    mediafile.attributes?.segments,
                    segmentsRef.current
                  ),
                },
              } as any as MediaFile,
              user
            ),
          ])
          .then(() => {
            saveCompleted(toolId);
            savingRef.current = false;
          })
          .catch((err) => {
            //so we don't come here...we go to continue/logout
            saveCompleted(toolId, err.message);
            savingRef.current = false;
          });
      }
    }
  };

  useEffect(() => {
    console.log('ctx save req');
    if (saveRequested(toolId) && !savingRef.current) writeSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveRequested]);

  const setPlayerSegments = (segments: string) => {
    if (
      !allowSegment ||
      !segmentsRef.current ||
      segmentsRef.current.indexOf('},{') === -1
    ) {
      setDefaultSegments(segments);
      onSegment && onSegment(segments);
    }
    if (!playingRef.current) {
      var segs = parseRegions(segments);
      if (segs.regions.length > 0) {
        setInitialPosition(segs.regions[0].start);
        setRequestPlay(true);
      }
    }
  };

  const onCurrentSegment = (segment: IRegion | undefined) => {
    console.log('onCurrent', segment);
    var index = 0;
    if (segment && segmentsRef.current) {
      var segs = parseRegions(segmentsRef.current);
      index =
        segs.regions
          .sort((a: IRegion, b: IRegion) => a.start - b.start)
          .findIndex((r: IRegion) => r.start === segment.start) + 1;
    }
    console.log('onCurSeg', index);
    setCurrentSegment && setCurrentSegment(segment, index);
  };
  const onSegmentChange = (segments: string) => {
    segmentsRef.current = segments;
    setDefaultSegments(segments); //now we'll notice if we reset them in SetPlayerSegments
    onSegment && onSegment(segments);
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
    console.log('ctx playing');
    if (playing !== playingRef.current) setRequestPlay(playing);
  }, [playing]);

  useEffect(() => {
    console.log('ctx cur step');
    setupLocate(setPlayerSegments);
    return () => {
      setupLocate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep]);

  useEffect(() => {
    console.log('ctx tool chg');
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
        allowAutoSegment={allowAutoSegment}
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
              disabled={!isChanged(toolId)}
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
