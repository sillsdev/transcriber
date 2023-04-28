import { useGlobal } from 'reactn';
import { Button } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { UnsavedContext } from '../../context/UnsavedContext';
import {
  IRegion,
  IRegionParams,
  parseRegions,
} from '../../crud/useWavesurferRegions';
import WSAudioPlayer from '../WSAudioPlayer';
import { useSelector, shallowEqual } from 'react-redux';
import { IWsAudioPlayerStrings, MediaFile } from '../../model';
import { UpdateRecord } from '../../model/baseModel';
import { playerSelector } from '../../selector';
import { NamedRegions, getSegments, updateSegments } from '../../utils';
import { TransformBuilder } from '@orbit/data';
import usePassageDetailContext from '../../context/usePassageDetailContext';
export enum SaveSegments {
  showSaveButton = 0,
  saveButNoButton = 1,
}
interface IProps {
  allowSegment?: NamedRegions | undefined;
  saveSegments?: SaveSegments;
  allowAutoSegment?: boolean;
  suggestedSegments?: string;
  defaultSegParams?: IRegionParams;
  canSetDefaultParams?: boolean;
  onSegment?: (segment: string) => void;
  onSegmentParamChange?: (params: IRegionParams, teamDefault: boolean) => void;
  onProgress?: (progress: number) => void;
  onSaveProgress?: (progress: number) => void;
  onInteraction?: () => void;
  allowZoomAndSpeed?: boolean;
  position?: number;
  chooserReduce?: number;
}

export function PassageDetailPlayer(props: IProps) {
  const {
    allowSegment,
    allowAutoSegment,
    saveSegments,
    suggestedSegments,
    defaultSegParams,
    canSetDefaultParams,
    onSegment,
    onSegmentParamChange,
    onProgress,
    onSaveProgress,
    onInteraction,
    allowZoomAndSpeed,
    position,
    chooserReduce,
  } = props;

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
  const [requestPlay, setRequestPlay] = useState<{
    play: boolean | undefined;
    regionOnly: boolean;
  }>({ play: undefined, regionOnly: false });
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
    currentSegmentIndex,
    setCurrentSegment,
    discussionMarkers,
    handleHighlightDiscussion,
    playerMediafile,
    forceRefresh,
  } = usePassageDetailContext();

  const [defaultSegments, setDefaultSegments] = useState('{}');

  const segmentsRef = useRef('');
  const playingRef = useRef(playing);
  const savingRef = useRef(false);
  const mediafileRef = useRef<MediaFile>();

  const loadSegments = () => {
    const segs = mediafileRef.current?.attributes?.segments || '{}';
    if (allowSegment) segmentsRef.current = getSegments(allowSegment, segs);
    setDefaultSegments(segmentsRef.current);
    onSegment && onSegment(segmentsRef.current);
  };
  useEffect(() => {
    //we need a ref for onDuration
    mediafileRef.current = playerMediafile;
  }, [playerMediafile]);

  useEffect(() => {
    if (allowSegment && suggestedSegments) {
      segmentsRef.current = suggestedSegments;
      setDefaultSegments(segmentsRef.current);
      onSegment && onSegment(segmentsRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSegment, suggestedSegments]);

  useEffect(() => {
    if (allowSegment) loadSegments();
    else setDefaultSegments('{}');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSegment, playerMediafile]);

  const writeSegments = async () => {
    if (!savingRef.current) {
      savingRef.current = true;
      if (mediafileRef.current) {
        var mediafile = mediafileRef.current;
        await memory
          .update((t) => [
            ...UpdateRecord(
              t,
              {
                type: 'mediafile',
                id: mediafile.id,
                attributes: {
                  segments: updateSegments(
                    allowSegment ?? NamedRegions.BackTranslation,
                    mediafile.attributes?.segments ?? '{}',
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

  const onDuration = (duration: number) => {
    if (
      mediafileRef.current &&
      !Boolean(mediafileRef.current.attributes.sourceSegments) &&
      duration &&
      Math.floor(duration) !==
        Math.floor(mediafileRef.current.attributes.duration)
    ) {
      console.log(
        `update duration to ${Math.floor(duration)} from
        ${Math.floor(mediafileRef.current.attributes.duration)}`
      );
      memory
        .update((t: TransformBuilder) =>
          t.replaceAttribute(
            mediafileRef.current as MediaFile, //I already checked for undefined
            'duration',
            Math.floor(duration)
          )
        )
        .then(() => {
          forceRefresh();
        });
    }
  };

  useEffect(() => {
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
        setRequestPlay({ play: true, regionOnly: true });
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
  const onSegmentChange = (segments: string) => {
    segmentsRef.current = segments;
    setDefaultSegments(segments); //now we'll notice if we reset them in SetPlayerSegments
    onSegment && onSegment(segments);
    if (allowSegment && saveSegments !== undefined) {
      toolChanged(toolId);
    } else {
      //not saving segments...so don't update changed
    }
  };

  const onPlayStatus = (newPlaying: boolean) => {
    if (playingRef.current !== newPlaying) {
      setPlaying(newPlaying);
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
    setupLocate(setPlayerSegments);
    return () => {
      setupLocate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, allowSegment]);

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
  useEffect(() => {
    setInitialPosition(position);
  }, [position]);

  return (
    <div id="detailplayer">
      <WSAudioPlayer
        id="audioPlayer"
        allowRecord={false}
        size={playerSize - (chooserReduce ?? 0)}
        blob={audioBlob}
        initialposition={initialposition}
        isPlaying={requestPlay.play}
        regionOnly={requestPlay.regionOnly}
        loading={loading}
        busy={pdBusy}
        allowSegment={allowSegment}
        allowAutoSegment={allowAutoSegment}
        defaultRegionParams={defaultSegParams}
        canSetDefaultParams={canSetDefaultParams}
        segments={defaultSegments}
        currentSegmentIndex={currentSegmentIndex}
        markers={discussionMarkers}
        onMarkerClick={handleHighlightDiscussion}
        setBusy={setPDBusy}
        onSegmentChange={onSegmentChange}
        onSegmentParamChange={onSegmentParamChange}
        onPlayStatus={onPlayStatus}
        onInteraction={onInteraction}
        onCurrentSegment={onCurrentSegment}
        allowZoom={allowZoomAndSpeed}
        allowSpeed={allowZoomAndSpeed}
        onProgress={onProgress}
        onSaveProgress={onSaveProgress}
        onDuration={onDuration}
        metaData={
          saveSegments === SaveSegments.showSaveButton ? (
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

export default PassageDetailPlayer;
