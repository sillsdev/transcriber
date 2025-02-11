import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { orgDefaultAsr, useOrgDefaults } from '../../crud/useOrgDefaults';
import { TokenContext } from '../../context/TokenProvider';
import { IAsrState } from './AsrAlphabet';
import { axiosGet, axiosPost } from '../../utils/axios';
import { HttpStatusCode } from 'axios';
import { findRecord } from '../../crud/tryFindRecord';
import { useSnackBar } from '../../hoc/SnackBar';
import { remoteId } from '../../crud/remoteId';
import { RecordKeyMap } from '@orbit/records';
import { useGlobal } from '../../context/GlobalContext';
import { ActionRow, AltButton } from '../../control';
import { ISharedStrings, ITranscriberStrings, MediaFileD } from '../../model';
import { getSegments, NamedRegions } from '../../utils/namedSegments';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector, transcriberSelector } from '../../selector';
import { Stack, Typography } from '@mui/material';
import { ignoreV1 } from '../../utils/ignoreV1';

export const getTaskId = (mediaRec: MediaFileD | undefined) => {
  const regionstr = getSegments(
    NamedRegions.TRTask,
    mediaRec?.attributes?.segments || '{}'
  );
  const segs = JSON.parse(regionstr ?? {});
  if (segs?.regions?.[0]?.label) {
    return segs.regions[0].label;
  } else {
    return undefined;
  }
};

interface AsrProgressProps {
  mediaId: string;
  phonetic: boolean;
  setTranscription?: (transcription: string) => void;
  onSaveTaskId: (mediaRec: MediaFileD) => void;
  onClose: () => void;
}

export default function AsrProgress({
  mediaId,
  phonetic,
  setTranscription,
  onSaveTaskId,
  onClose,
}: AsrProgressProps) {
  const addingRef = React.useRef(false);
  const [working, setWorking] = React.useState(false);
  const { getOrgDefault } = useOrgDefaults();
  const [memory] = useGlobal('memory');
  const token = React.useContext(TokenContext).state.accessToken ?? '';
  const { showMessage } = useSnackBar();
  const [taskId, setTaskId] = React.useState('');
  const taskTimer = React.useRef<NodeJS.Timeout>();
  const timerDelay = 5000; //5 seconds
  const t: ITranscriberStrings = useSelector(transcriberSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const setTranscribing = (adding: boolean) => {
    addingRef.current = adding;
  };

  const status = (message: string) => {
    showMessage(message);
    console.log(message);
  };

  const checkTask = async () => {
    console.log(`checking task: ${taskId}`);
    const response = await axiosGet(`aero/transcription/${taskId}`);
    if (response?.transcription) {
      //Do something with the transcription here
      console.log(response);
      setTranscription &&
        setTranscription(
          phonetic ? response?.phonetic : response?.transcription
        );
      setTaskId('');
    } else if (response?.transcription === '') {
      status(t.noAsrTranscription);
      setTaskId('');
    } else {
      console.log('not done', response);
      setWorking(true);
    }
    return undefined;
  };

  const launchTimer = () => {
    taskTimer.current = setInterval(() => {
      checkTask();
    }, timerDelay);
  };

  const closing = () => {
    if (taskTimer.current) {
      clearInterval(taskTimer.current);
    }
    setTranscribing(false);
    setWorking(false);
    onClose && onClose();
  };

  const postTranscribe = async () => {
    const remId =
      remoteId('mediafile', mediaId, memory?.keyMap as RecordKeyMap) ?? mediaId;
    const asr = getOrgDefault(orgDefaultAsr) as IAsrState | undefined;
    const iso = asr?.dialect ?? asr?.mmsIso ?? 'eng';
    const romanize = asr?.selectRoman ?? false;

    const response = await axiosPost(
      `mediafiles/${remId}/transcription/${iso}/${romanize}`,
      undefined,
      token
    );

    if (response.status === HttpStatusCode.Ok) {
      const mediaRec = response?.data.data as MediaFileD;
      const taskId = getTaskId(mediaRec);
      if (taskId) {
        onSaveTaskId(mediaRec);
        setTaskId(taskId);
      } else {
        status(t.aiAsrFailed);
        closing();
      }
    } else {
      status(t.aiAsrFailed);
      closing();
    }
  };

  React.useEffect(() => {
    if (taskId) {
      if (!taskTimer.current) launchTimer();
    } else if (taskTimer.current) {
      clearInterval(taskTimer.current);
      taskTimer.current = undefined;
      closing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  React.useEffect(() => {
    if (addingRef.current) return;
    setTranscribing(true);
    setWorking(false);
    const mediaRec = findRecord(memory, 'mediafile', mediaId) as MediaFileD;
    if (ignoreV1(mediaRec?.attributes?.transcription)) {
      status(t.transcriptionExists);
      closing();
    } else {
      const taskId = getTaskId(mediaRec);
      if (taskId) {
        setTaskId(taskId);
      } else {
        postTranscribe();
      }
    }

    return () => {
      if (taskTimer.current) {
        clearInterval(taskTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={1}>
        <LinearProgress />
        {working && <Typography>{t.aiWillContinue}</Typography>}
        <ActionRow>
          <AltButton onClick={closing}>{ts.cancel}</AltButton>
        </ActionRow>
      </Stack>
    </Box>
  );
}
