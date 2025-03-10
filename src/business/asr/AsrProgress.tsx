import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { TokenContext } from '../../context/TokenProvider';
import { IAsrState } from './AsrAlphabet';
import { axiosGet, axiosPost } from '../../utils/axios';
import { AxiosError } from 'axios';
import { findRecord } from '../../crud/tryFindRecord';
import { useSnackBar } from '../../hoc/SnackBar';
import { remoteId } from '../../crud/remoteId';
import { RecordKeyMap } from '@orbit/records';
import { useGlobal } from '../../context/GlobalContext';
import { ActionRow, AltButton } from '../../control';
import {
  ICardsStrings,
  ISharedStrings,
  ITranscriberStrings,
  MediaFileD,
} from '../../model';
import { getSegments, NamedRegions } from '../../utils/namedSegments';
import { shallowEqual, useSelector } from 'react-redux';
import {
  cardsSelector,
  sharedSelector,
  transcriberSelector,
} from '../../selector';
import { Stack, Typography } from '@mui/material';
import { ignoreVs } from '../../utils/ignoreVs';
import { infoMsg, logError, Severity } from '../../utils';
import { useGetAsrSettings } from '../../crud/useGetAsrSettings';

export interface VerseTask {
  taskId: string;
  verse: string;
  complete: boolean;
}

interface AsrProgressProps {
  mediaId: string;
  phonetic: boolean;
  force?: boolean;
  contentVerses?: string[];
  setTranscription: (transcription: string) => void;
  onPullTasks: (mediaId: string) => void;
  onClose: () => void;
}

export default function AsrProgress({
  mediaId,
  phonetic,
  force,
  contentVerses,
  setTranscription,
  onPullTasks,
  onClose,
}: AsrProgressProps) {
  const addingRef = React.useRef(false);
  const [working, setWorking] = React.useState(false);
  const { getAsrSettings } = useGetAsrSettings();
  const [memory] = useGlobal('memory');
  const token = React.useContext(TokenContext).state.accessToken ?? '';
  const { showMessage } = useSnackBar();
  const [taskId, setTaskIdx] = React.useState('');
  const taskIdRef = React.useRef('');
  const [tasks, setTasks] = React.useState<VerseTask[]>();
  const taskTimer = React.useRef<NodeJS.Timeout>();
  const timerDelay = 5000; //5 seconds
  const t: ITranscriberStrings = useSelector(transcriberSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const tc: ICardsStrings = useSelector(cardsSelector, shallowEqual);
  const [errorReporter] = useGlobal('errorReporter');

  const getTasks = (mediaRec: MediaFileD | undefined) => {
    const regionstr = getSegments(
      NamedRegions.TRTask,
      mediaRec?.attributes?.segments || '{}'
    );
    const segs = JSON.parse(regionstr ?? {});
    var tsks: VerseTask[] = [];
    if (Array.isArray(segs?.regions)) {
      (segs?.regions as Array<any>).forEach((region) => {
        const part: string[] = region.label.split('|');
        tsks.push({
          taskId: part[0],
          verse: part[1], //undefined if no timing
          complete: contentVerses?.includes(part[1] ?? 'no-verses') ?? false,
        });
      });
      return tsks;
    } else {
      return undefined;
    }
  };

  const getTaskId = (
    mediaRec: MediaFileD | undefined
  ): [string | undefined, VerseTask[] | undefined] => {
    var tsks = getTasks(mediaRec);
    if (tsks && !tasks) setTasks(tsks);
    return [tsks?.find((tasks) => !tasks.complete)?.taskId, tsks];
  };

  const setTaskId = (taskId: string) => {
    setTaskIdx(taskId);
    taskIdRef.current = taskId;
    if (taskId === '') setTasks(undefined);
  };
  const setTranscribing = (adding: boolean) => {
    addingRef.current = adding;
  };

  const status = (message: string) => {
    showMessage(message);
    console.log(message);
  };

  const checkTask = async () => {
    const response: any = await axiosGet(
      `aero/transcription/${taskIdRef.current}`
    );
    if (response?.transcription) {
      console.log(taskIdRef.current, response);
      var verse = '';
      var nextTask = '';
      if (tasks) {
        var ix = tasks.findIndex((t) => t.taskId === taskIdRef.current);
        if (ix >= 0) {
          if (tasks[ix]?.verse) verse = ` \\v ${tasks[ix].verse} `;
          tasks[ix].complete = true;
          nextTask = ix < tasks.length - 1 ? tasks[ix + 1].taskId : '';
        }
      }
      setTranscription(
        verse + (phonetic ? response?.phonetic : response?.transcription)
      );
      setTaskId(nextTask);
    } else if (response?.transcription === '') {
      status(t.noAsrTranscription);
      setTaskId('');
    } else {
      console.log(`${taskIdRef.current} not done`, response);
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
    const asr = getAsrSettings() as IAsrState | undefined;
    const iso = asr?.mmsIso ?? 'eng';
    const romanize = asr?.selectRoman ?? false;
    try {
      const response = await axiosPost(
        `mediafiles/${remId}/transcription/${iso}/${romanize}`,
        undefined,
        token
      );
      const mediaRec = response?.data.data as MediaFileD;
      const tasks = getTasks(mediaRec);
      if (tasks) {
        onPullTasks(remId);
        if (tasks.length > 1) setTasks(tasks);
        setTaskId(tasks[0].taskId);
      } else {
        status(t.aiAsrFailed);
        closing();
      }
    } catch (error: any) {
      logError(
        Severity.error,
        errorReporter,
        infoMsg(error, t.aiAsrFailed + (error as AxiosError).message)
      );
      status(t.aiAsrFailed + (error as AxiosError).message);
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
    const [taskId, tasks] = getTaskId(mediaRec);
    if (
      (!tasks || !taskId) &&
      ignoreVs((mediaRec?.attributes?.transcription ?? '').trim())
    ) {
      status(t.transcriptionExists);
      closing();
    } else if (taskId && !force) {
      setTaskId(taskId);
    } else {
      postTranscribe();
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
        {working && (
          <Typography>
            {t.aiWillContinue.replace(/\{0\}/g, tc.recognizeSpeech)}
          </Typography>
        )}
        <ActionRow>
          <AltButton onClick={closing}>{ts.close}</AltButton>
        </ActionRow>
      </Stack>
    </Box>
  );
}
