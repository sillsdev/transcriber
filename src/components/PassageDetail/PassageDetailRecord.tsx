import { shallowEqual, useSelector } from 'react-redux';
import { ISharedStrings, MediaFile } from '../../model';
import { Typography, Box, Stack } from '@mui/material';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  findRecord,
  IMediaState,
  MediaSt,
  pullTableList,
  related,
  remoteIdNum,
  useFetchMediaUrl,
  VernacularTag,
  waitForLocalId,
} from '../../crud';
import { useGlobal } from 'reactn';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { passageDefaultFilename } from '../../utils/passageDefaultFilename';
import Memory from '@orbit/memory';
import { useSnackBar } from '../../hoc/SnackBar';
import MediaRecord from '../MediaRecord';
import { UnsavedContext } from '../../context/UnsavedContext';
import Uploader from '../Uploader';
import AudacityManager from '../Sheet/AudacityManager';
import { isElectron } from '../../api-variable';
import { PriButton } from '../../control';
import BigDialog from '../../hoc/BigDialog';
import VersionDlg from '../AudioTab/VersionDlg';
import SpeakerName from '../SpeakerName';
import { sharedSelector } from '../../selector';
import { RecordButtons } from './RecordButtons';
import { useOrbitData } from '../../hoc/useOrbitData';
import { RecordIdentity, RecordKeyMap } from '@orbit/records';
import { useNoiseRemoval } from '../../utils/useNoiseRemoval';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import { PlayInPlayer } from '../../context/PassageDetailContext';

interface IProps {
  ready?: () => boolean;
  width?: number;
}

const SaveWait = 500;

export function PassageDetailRecord(props: IProps) {
  const { ready } = props;
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const {
    startSave,
    toolChanged,
    toolsChanged,
    saveRequested,
    clearRequested,
    clearCompleted,
    waitForSave,
  } = useContext(UnsavedContext).state;
  const [reporter] = useGlobal('errorReporter');
  const [, setBigBusy] = useGlobal('importexportBusy');
  const [plan] = useGlobal('plan');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const [offline] = useGlobal('offline');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const { passage, sharedResource, mediafileId, chooserSize, setRecording, setSelected } =
    usePassageDetailContext();
  const [taskId, setTaskIdx] = useState("");
  const taskIdRef = useRef<string>("");
  const { showMessage } = useSnackBar();
  const toolId = 'RecordTool';
  const onSaving = () => {
    setBigBusy(true);
  };
  const onReady = () => {
    setBigBusy(false);
  };
  const [importList, setImportList] = useState<File[]>();
  const cancelled = useRef(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [audacityVisible, setAudacityVisible] = useState(false);
  const [versionVisible, setVersionVisible] = useState(false);
  const [preload, setPreload] = useState(0);
  const [recorderState, setRecorderState] = useState<IMediaState>();
  const [hasExistingVersion, setHasExistingVersion] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const [speaker, setSpeaker] = useState('');
  const [hasRights, setHasRight] = useState(false);
  const {startTask, checkTask} = useNoiseRemoval();
  const taskTimer = useRef<NodeJS.Timeout>();

  const setTaskId = (task: string) => {
    setTaskIdx(task);
    taskIdRef.current = task;
  }

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  useEffect(() => {
    if (saveRequested(toolId)) handleSave();
    else if (clearRequested(toolId)) {
      clearCompleted(toolId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  useEffect(() => {
    if (!mediafileId) {
      fetchMediaUrl({ id: mediafileId });
      setResetMedia(true);
    } else if (mediafileId !== mediaState.id) {
      fetchMediaUrl({ id: mediafileId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId, passage]);

  useEffect(() => {
    setDefaultFileName(
      passageDefaultFilename(passage, plan, memory, VernacularTag, offline)
    );
  }, [memory, passage, mediafiles, plan, offline]);

  useEffect(() => {
    const mediaRec = findRecord(memory, 'mediafile', mediafileId) as
      | MediaFile
      | undefined;
    const performer = mediaRec?.attributes?.performedBy;
    if (performer) {
      setSpeaker(performer);
      setHasRight(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId, mediafiles]);

  useEffect(() => {
    setHasExistingVersion(
      Boolean(mediafileId) &&
        recorderState?.status === MediaSt.FETCHED &&
        recorderState?.id === mediafileId
    );
  }, [mediafileId, recorderState]);

  const passageId = useMemo(
    () => related(sharedResource, 'passage') ?? passage.id,
    [sharedResource, passage]
  );
  const handleSave = () => {
    startSave(toolId);
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    setStatusText('');
    if (importList) {
      setImportList(undefined);
      setUploadVisible(false);
      setAudacityVisible(false);
    }
    setPreload(preload + 1);
  };

  const saveIfChanged = (cb: () => void) => {
    if (canSave) {
      startSave(toolId);
      waitForSave(() => cb(), SaveWait);
    } else cb();
  };

  //from the on screen recorder...send it off to the uploader
  const uploadMedia = async (files: File[]) => {
    setImportList(files);
    setUploadVisible(true);
  };
  const handleAudacityImport = (i: number, list: File[]) => {
    saveIfChanged(() => {
      setImportList(list);
      setUploadVisible(true);
    });
  };

  const handleAudacityClose = () => {
    setAudacityVisible(false);
  };
  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };
  const handleUpload = () => {
    saveIfChanged(() => {
      setUploadVisible(true);
    });
  };
  const handleAudacity = () => {
    saveIfChanged(() => {
      setAudacityVisible(true);
    });
  };
  const handleVersions = () => {
    setVersionVisible(true);
  };
  const handleVerHistClose = () => {
    setVersionVisible(false);
  };
  const handleNameChange = (name: string) => {
    setSpeaker(name);
  };
  const handleRights = (hasRights: boolean) => setHasRight(hasRights);
  const handleReload = () => setPreload(preload + 1);
  const handleTrackRecorder = (state: IMediaState) => setRecorderState(state);
  const handleNoiseRemoval = () => {
    //send the id and get a taskid
    startTask(remoteIdNum('mediafile', mediafileId, memory.keyMap as RecordKeyMap)).then((task) => {
      setTaskId(task);
      if (task) 
        launchTimer(); 
      else 
        showMessage(ts.noiseRemovalFailed);
    })
  }

  const cleanupTimer = () => {
    if (taskTimer.current) {
      try {
        clearInterval(taskTimer.current);
      } catch (error) {
        console.log(error);
      }
      taskTimer.current = undefined;
    }
  };

  const checkNoiseRemovalTask = async () => {
    if (!taskIdRef.current) return;
    try {
      var currentId = remoteIdNum('mediafile', mediafileId, memory.keyMap as RecordKeyMap);
      var mediaId = await checkTask(currentId, taskIdRef.current);
      if (mediaId && mediaId !== currentId.toString())
      {
        cleanupTimer();
        setTaskId("");
        await pullTableList(
          'mediafile',
          Array(mediaId),
          memory,
          remote,
          backup,
          reporter
        );
        var locaId = await waitForLocalId('mediafile', mediaId, memory.keyMap as RecordKeyMap);
        setSelected(locaId, PlayInPlayer.no);
        handleReload();
      } 
    } catch (error) {
      console.log(error);
      showMessage(ts.noiseRemovalFailed);
      setTaskId("");
      cleanupTimer();
    }
  }
  const launchTimer = () => {
    taskTimer.current = setInterval(() => {
      checkNoiseRemovalTask();
    }, 3000);
  };

  return (
    <Stack sx={{ width: props.width }}>
      <RecordButtons
        onVersions={hasExistingVersion ? handleVersions : undefined}
        onReload={hasExistingVersion ? handleReload : undefined}
        onUpload={handleUpload}
        onAudacity={isElectron ? handleAudacity : undefined}
        onNoiseRemoval={!offline && hasExistingVersion && !canSave  ? handleNoiseRemoval : undefined}
        noiseRemoveInProgress={taskId !== ""}
      />
      <Box sx={{ py: 1 }}>
        <SpeakerName
          name={speaker}
          onChange={handleNameChange}
          onRights={handleRights}
        />
      </Box>
      <MediaRecord
        toolId={toolId}
        mediaId={mediafileId}
        uploadMethod={uploadMedia}
        onSaving={onSaving}
        onReady={onReady}
        onRecording={setRecording}
        defaultFilename={defaultFilename}
        allowRecord={hasRights}
        allowWave={true}
        showFilename={true}
        showLoad={false}
        preload={preload}
        trackState={handleTrackRecorder}
        setCanSave={setCanSave}
        setStatusText={setStatusText}
        doReset={resetMedia}
        setDoReset={setResetMedia}
        size={300 - chooserSize}
        metaData={
          <>
            <Typography
              variant="caption"
              sx={{
                mr: 2,
                alignSelf: 'center',
                display: 'block',
                gutterBottom: 'true',
              }}
            >
              {statusText}
            </Typography>
            <PriButton
              id="rec-save"
              onClick={handleSave}
              disabled={(ready && !ready()) || !canSave || !hasRights}
            >
              {ts.save}
            </PriButton>
          </>
        }
      />

      <Uploader
        recordAudio={false}
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={false}
        finish={afterUpload}
        cancelled={cancelled}
        passageId={passageId}
        performedBy={speaker}
        onSpeakerChange={handleNameChange}
      />
      <AudacityManager
        item={1}
        open={audacityVisible}
        onClose={handleAudacityClose}
        passageId={
          {
            type: 'passage',
            id: passageId,
          } as RecordIdentity
        }
        mediaId={mediafileId}
        onImport={handleAudacityImport}
        speaker={speaker}
        onSpeaker={handleNameChange}
      />
      <BigDialog
        title={ts.versionHistory}
        isOpen={versionVisible}
        onOpen={handleVerHistClose}
      >
        <VersionDlg
          passId={passageId}
          canSetDestination={false}
          hasPublishing={false}
        />
      </BigDialog>
    </Stack>
  );
}

export default PassageDetailRecord;
