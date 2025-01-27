import { useGlobal } from '../../context/GlobalContext';
import { Button, IconButton, Typography } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { UnsavedContext } from '../../context/UnsavedContext';
import { IRegionParams, parseRegions } from '../../crud/useWavesurferRegions';
import WSAudioPlayer from '../WSAudioPlayer';
import { useSelector, shallowEqual } from 'react-redux';
import { IWsAudioPlayerStrings, MediaFile, MediaFileD } from '../../model';
import { UpdateRecord } from '../../model/baseModel';
import { playerSelector } from '../../selector';
import { NamedRegions, updateSegments } from '../../utils/namedSegments';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import TranscriptionShow from '../TranscriptionShow';
import { related } from '../../crud/related';
import {
  RequestPlay,
  usePlayerLogic,
} from '../../business/player/usePlayerLogic';
import TranscriptionLogo from '../../control/TranscriptionLogo';
import { useOrgDefaults, orgDefaultFeatures } from '../../crud/useOrgDefaults';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';
import SelectAsrLanguage, {
  AsrTarget,
} from '../../business/asr/SelectAsrLanguage';
import AsrButton from '../../control/SplitButton';
import { IValues } from '../Team/TeamSettings';
import AsrProgress from '../../business/asr/AsrProgress';
import { useGetAsrSettings } from '../../crud/useGetAsrSettings';

export enum SaveSegments {
  showSaveButton = 0,
  saveButNoButton = 1,
}
export interface DetailPlayerProps {
  allowSegment?: NamedRegions | undefined;
  saveSegments?: SaveSegments;
  allowAutoSegment?: boolean;
  suggestedSegments?: string;
  verses?: string;
  defaultSegParams?: IRegionParams;
  canSetDefaultParams?: boolean;
  onSegment?: (segment: string, init: boolean) => void;
  onSegmentParamChange?: (params: IRegionParams, teamDefault: boolean) => void;
  onStartRegion?: (position: number) => void;
  onProgress?: (progress: number) => void;
  onSaveProgress?: (progress: number) => void;
  onInteraction?: () => void;
  onTranscription?: (transcription: string) => void;
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
    verses,
    defaultSegParams,
    canSetDefaultParams,
    onSegment,
    onSegmentParamChange,
    onStartRegion,
    onProgress,
    onSaveProgress,
    onInteraction,
    onTranscription,
    allowZoomAndSpeed,
    position,
    chooserReduce,
    parentToolId,
  } = props;

  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
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
  const [requestPlay, setRequestPlay] = useState<RequestPlay>({
    play: undefined,
    regionOnly: false,
    request: new Date(),
  });
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
  const { getOrgDefault } = useOrgDefaults();
  const [org] = useGlobal('organization');
  const { getAsrSettings } = useGetAsrSettings();
  const [asrLangVisible, setAsrLangVisible] = useState(false);
  const [phonetic, setPhonetic] = useState(false);

  const [features, setFeatures] = useState<IValues>();
  enum AiOptions {
    AutoTranscribe = 'Auto Transcribe',
    AsrSettings = 'ASR Settings',
  }
  const [asrProgressVisble, setAsrProgressVisble] = useState(false);

  const { onPlayStatus, onCurrentSegment, setSegmentToWhole } = usePlayerLogic({
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
  });

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
                  ...mediafile?.attributes,
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
    //TT 6149 but I wonder why this was here? if (!playingRef.current) {
    var segs = parseRegions(segments);
    if (segs.regions.length > 0) {
      setInitialPosition(segs.regions[0].start);
      setRequestPlay({
        play: true,
        regionOnly: true,
        request: new Date(),
      });
    }
    //}
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

  const handleShowTranscription = () => {
    setShowTranscriptionId(related(playerMediafile, 'passage') ?? '');
  };

  const handleCloseTranscription = () => {
    setShowTranscriptionId('');
  };

  const handleTranscribe = () => {
    const asr = getAsrSettings();
    if (asr?.mmsIso === undefined || asr?.mmsIso === 'und') {
      setAsrLangVisible(true);
      return;
    }
    setAsrLangVisible(false);
    console.log('auto transcribe');
    setAsrProgressVisble(true);
    setPhonetic(asr?.target === AsrTarget.phonetic);
  };

  const handleAutoTranscribe = () => {
    const asr = getAsrSettings();
    if (!(asr?.mmsIso === undefined || asr?.mmsIso === 'und')) {
      setAsrLangVisible(true);
    } else {
      handleTranscribe();
    }
  };

  useEffect(() => {
    if (org) {
      setFeatures(getOrgDefault(orgDefaultFeatures));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const handleAsrClick = (option: string) => {
    if (option === AiOptions.AutoTranscribe) {
      handleTranscribe();
    } else if (option === AiOptions.AsrSettings) {
      setAsrLangVisible(true);
    } else {
      handleAutoTranscribe();
    }
  };

  const handleAsrProgressVisible = (v: boolean) => {
    setAsrProgressVisble(v);
  };

  return (
    <div id="detailplayer">
      <WSAudioPlayer
        id="audioPlayer"
        allowRecord={false}
        size={playerSize - (chooserReduce ?? 0)}
        blob={audioBlob}
        initialposition={initialposition}
        setInitialPosition={setInitialPosition}
        isPlaying={requestPlay.play}
        regionOnly={requestPlay.regionOnly}
        request={requestPlay.request}
        loading={loading}
        busy={pdBusy}
        allowSegment={allowSegment}
        allowAutoSegment={allowAutoSegment}
        defaultRegionParams={defaultSegParams}
        canSetDefaultParams={canSetDefaultParams}
        segments={defaultSegments}
        verses={verses}
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
            {features?.aiTranscribe && !offline && (
              <AsrButton
                options={[AiOptions.AutoTranscribe, AiOptions.AsrSettings]}
                onClick={handleAsrClick}
                title="AI Transcribe"
              >
                <TranscriptionLogo sx={{ height: 18, width: 18 }} />
              </AsrButton>
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
      {asrLangVisible && (
        <BigDialog
          title="Speech Recogniztion Settings"
          description={
            <Typography variant="body2" sx={{ maxWidth: 500 }}>
              Choose the language to recognize. If the language is not
              available, choose a closely related language with a similar
              writing system.
            </Typography>
          }
          isOpen={asrLangVisible}
          onOpen={() => setAsrLangVisible(false)}
        >
          <SelectAsrLanguage onOpen={handleTranscribe} />
        </BigDialog>
      )}
      {asrProgressVisble && (
        <BigDialog
          title={'Ai Transcription in Progress'}
          isOpen={asrProgressVisble}
          onOpen={handleAsrProgressVisible}
          bp={BigDialogBp.sm}
        >
          <AsrProgress
            mediaId={playerMediafile?.id ?? ''}
            phonetic={phonetic}
            setTranscription={onTranscription}
            onClose={() => handleAsrProgressVisible(false)}
          />
        </BigDialog>
      )}
    </div>
  );
}

export default PassageDetailPlayer;
