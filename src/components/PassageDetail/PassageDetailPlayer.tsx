import { useGlobal } from 'reactn';
import { Button, IconButton } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { UnsavedContext } from '../../context/UnsavedContext';
import {
  IRegion,
  IRegionParams,
  parseRegions,
} from '../../crud/useWavesurferRegions';
import WSAudioPlayer from '../WSAudioPlayer';
import { useSelector, shallowEqual } from 'react-redux';
import { IWsAudioPlayerStrings, MediaFile, MediaFileD } from '../../model';
import { UpdateRecord } from '../../model/baseModel';
import { playerSelector } from '../../selector';
import { JSONParse } from '../../utils/jsonParse';
import {
  NamedRegions,
  getSegments,
  updateSegments,
} from '../../utils/namedSegments';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import TranscriptionShow from '../TranscriptionShow';
import { related } from '../../crud/related';

export enum SaveSegments {
  showSaveButton = 0,
  saveButNoButton = 1,
}
export interface DetailPlayerProps {
  allowSegment?: NamedRegions | undefined;
  saveSegments?: SaveSegments;
  allowAutoSegment?: boolean;
  suggestedSegments?: string;
  defaultSegParams?: IRegionParams;
  canSetDefaultParams?: boolean;
  onSegment?: (segment: string, init: boolean) => void;
  onSegmentParamChange?: (params: IRegionParams, teamDefault: boolean) => void;
  onStartRegion?: (position: number) => void;
  onProgress?: (progress: number) => void;
  onSaveProgress?: (progress: number) => void;
  onInteraction?: () => void;
  allowZoomAndSpeed?: boolean;
  position?: number;
  chooserReduce?: number;
  parentToolId?: string;
}

export function PassageDetailPlayer(props: DetailPlayerProps) {
  const {
    allowSegment,
    allowAutoSegment,
    saveSegments,
    suggestedSegments,
    defaultSegParams,
    canSetDefaultParams,
    onSegment,
    onSegmentParamChange,
    onStartRegion,
    onProgress,
    onSaveProgress,
    onInteraction,
    allowZoomAndSpeed,
    position,
    chooserReduce,
    parentToolId,
  } = props;

  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const {
    toolChanged,
    toolsChanged,
    isChanged,
    saveRequested,
    clearRequested,
    clearCompleted,
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
  const [showTranscriptionId, setShowTranscriptionId] = useState('');

  const segmentsRef = useRef('');
  const playingRef = useRef(playing);
  const savingRef = useRef(false);
  const mediafileRef = useRef<MediaFile>();
  const durationRef = useRef(0);

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
                    mediafile.attributes?.segments || '{}',
                    segmentsRef.current
                  ),
                },
              } as unknown as MediaFileD,
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

  const setSegmentToWhole = () => {
    if (allowSegment && setCurrentSegment && durationRef.current) {
      var segs = JSONParse(segmentsRef.current);
      //might be "[]"
      if ((segs.regions?.length ?? 0) < 3) {
        setCurrentSegment({ start: 0, end: durationRef.current }, -1);
      }
    }
  };
  const onDuration = (duration: number) => {
    durationRef.current = duration;
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
        .update((t) =>
          t.replaceAttribute(
            mediafileRef.current as MediaFileD, //I already checked for undefined
            'duration',
            Math.floor(duration)
          )
        )
        .then(() => {
          forceRefresh();
        });
    }
    setSegmentToWhole();
  };

  const setPlayerSegments = (segments: string) => {
    if (
      !allowSegment ||
      !segmentsRef.current ||
      segmentsRef.current.indexOf('},{') === -1
    ) {
      setDefaultSegments(segments);
      onSegment && onSegment(segments, true);
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
            (r: IRegion) =>
              r.start <= (segment?.start ?? 0) &&
              r.end >= (segment?.end ?? durationRef.current)
          ) + 1;
    } else {
      segment = { start: 0, end: durationRef.current };
    }
    setCurrentSegment && setCurrentSegment(segment, index);
  };
  const onSegmentChange = (segments: string) => {
    segmentsRef.current = segments;
    setDefaultSegments(segments); //now we'll notice if we reset them in SetPlayerSegments
    onSegment && onSegment(segments, false);
    if (allowSegment && saveSegments !== undefined) {
      //if I have a parentToolId it will save the segments
      toolChanged(parentToolId ?? toolId);
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
    if (saveRequested(toolId) && !savingRef.current) writeSegments();
    else if (clearRequested(toolId)) {
      clearCompleted(toolId);
    }
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

  const handleShowTranscription = () => {
    setShowTranscriptionId(related(playerMediafile, 'passage') ?? '');
  };

  const handleCloseTranscription = () => {
    setShowTranscriptionId('');
  };

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
        onStartRegion={onStartRegion}
        onPlayStatus={onPlayStatus}
        onInteraction={onInteraction}
        onCurrentSegment={onCurrentSegment}
        allowZoom={allowZoomAndSpeed}
        allowSpeed={allowZoomAndSpeed}
        onProgress={onProgress}
        onSaveProgress={onSaveProgress}
        onDuration={onDuration}
        metaData={
          <>
            {playerMediafile?.attributes?.transcription ? (
              <IconButton
                id="show-transcription"
                onClick={handleShowTranscription}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            ) : (
              <></>
            )}
            {saveSegments === SaveSegments.showSaveButton ? (
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
            )}
          </>
        }
      />
      {showTranscriptionId !== '' && (
        <TranscriptionShow
          id={showTranscriptionId}
          visible={showTranscriptionId !== ''}
          closeMethod={handleCloseTranscription}
        />
      )}
    </div>
  );
}

export default PassageDetailPlayer;
