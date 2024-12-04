import { useGlobal, useRef } from 'reactn';
import { RecordKeyMap } from '@orbit/records';

import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import Memory from '@orbit/memory';
import { pullTableList, waitForLocalId } from '../crud';
import logError, { Severity } from './logErrorService';
import {
  axiosDelete,
  axiosGet,
  axiosGetStream,
  axiosPostFile,
  axiosSendSignedUrl,
} from './axios';
import { HttpStatusCode } from 'axios';
import { uploadFile } from '../store/upload/actions';
import { useContext } from 'react';
import { TokenContext } from '../context/TokenProvider';

interface job {
  taskId: string;
  mediafileid: number;
  cb: (mediafileid: string) => void;
  tries: number;
}
interface fileTask {
  taskId: string;
  cb: (file: File | Error) => void;
  cancelRef: React.MutableRefObject<boolean>;
}
const timerDelay = 3000;
const waitTime = 1000 * 60 * 10; //10 minutes good?

export const useNoiseRemoval = () => {
  const [reporter] = useGlobal('errorReporter');
  const [coordinator] = useGlobal('coordinator');
  const [offline] = useGlobal('offline');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [errorReporter] = useGlobal('errorReporter');
  const jobList: job[] = [];
  const fileList: fileTask[] = [];
  const taskTimer = useRef<NodeJS.Timeout>();
  const token = useContext(TokenContext).state.accessToken ?? '';
  const requestNoiseRemoval = async (
    mediafileid: number,
    cb: (mediafileid: string) => void
  ) => {
    if (offline) return '';

    const opts = {
      timeout: 10000,
    };
    var response = await axiosGet(
      `mediafiles/${mediafileid}/noiseremoval`,
      opts
    );
    //taskid is in textquality
    var taskId = response.data.attributes['text-quality'] ?? '';
    jobList.push({ taskId, mediafileid, cb, tries: waitTime / timerDelay });
    if (!taskTimer.current) launchTimer();
    return taskId;
  };

  const requestFileNoiseRemoval = async (
    cancelRef: React.MutableRefObject<boolean>,
    file: File,
    cb: (file: File | Error) => void
  ) => {
    if (offline) return '';
    axiosPostFile('aero/noiseremoval', file).then((nrresponse) => {
      if (nrresponse.status === HttpStatusCode.Ok) {
        var taskId = nrresponse.data ?? '';
        fileList.push({
          taskId,
          cb,
          cancelRef,
        });
        if (!taskTimer.current) launchTimer();
      } else cb(new Error(nrresponse.statusText));
    });
  };

  const s3requestFileNoiseRemoval = async (
    cancelRef: React.MutableRefObject<boolean>,
    file: File,
    cb: (file: File | Error) => void
  ) => {
    if (offline) return '';
    var response = await axiosGet(
      `S3Files/put/AI/${file.name}/wav`,
      undefined,
      token
    );
    uploadFile(
      { id: 0, audioUrl: response, contentType: 'audio/wav' },
      file,
      reporter,
      token,
      (success: boolean, data: any, statusNum: number, statusText: string) => {
        if (success)
          axiosGet(`S3Files/get/AI/${file.name}/wav`, undefined, token).then(
            (response) => {
              axiosSendSignedUrl('aero/noiseremoval/fromfile', response).then(
                (nrresponse) => {
                  if (nrresponse.status === HttpStatusCode.Ok) {
                    var taskId = nrresponse.data ?? '';
                    fileList.push({
                      taskId,
                      cb,
                      cancelRef,
                    });
                    if (!taskTimer.current) launchTimer();
                  } else cb(new Error(response.statusText));
                  axiosDelete(`S3Files/AI/${file.name}`, token);
                }
              );
            }
          );
      }
    );
  };
  const checkJob = async (id: number, taskId: string) => {
    var response = await axiosGet(`mediafiles/${id}/noiseremoval/${taskId}`);
    //will be a new id if completed
    return response.data.id as string;
  };
  const checkFile = async (taskId: string) => {
    var response = await axiosGetStream(`aero/noiseremoval/${taskId}`);
    const data = await response?.json();
    if (data) return base64ToFile(data.data, data.fileName ?? taskId);
    return undefined;
  };
  const cleanupTimer = () => {
    if (taskTimer.current) {
      try {
        clearInterval(taskTimer.current);
      } catch (error) {
        logError(Severity.error, errorReporter, error as Error);
      }
      taskTimer.current = undefined;
    }
  };

  const base64ToFile = (base64Data: string, fileName: string) => {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'audio/wav' });
      // Create a File object from the Blob
      const file = new File([blob], fileName, { type: blob.type });
      return file;
    } catch (error: any) {
      console.log(error);
    }
  };
  /*
  const streamToFile = async (
    readableStream: ReadableStream,
    fileName: string
  ) => {
    // Create a new Blob from the stream
    const reader = readableStream.getReader();
    const chunks: Uint8Array[] = [];
    let done: boolean | undefined;
    let value: Uint8Array | undefined;

    while (!done) {
      ({ done, value } = await reader.read());
      if (value) {
        chunks.push(value);
      }
    }

    const blob = new Blob(chunks);

    // Create a File object from the Blob
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  };
*/
  const checkNoiseRemovalTasks = async () => {
    jobList.forEach(async (job) => {
      try {
        var mediaId = await checkJob(job.mediafileid, job.taskId);
        if (mediaId && mediaId !== job.mediafileid.toString()) {
          cleanupJob(job);
          await pullTableList(
            'mediafile',
            Array(mediaId),
            memory,
            remote,
            backup,
            reporter
          );
          var localId = await waitForLocalId(
            'mediafile',
            mediaId,
            memory.keyMap as RecordKeyMap
          );
          job.cb(localId);
        } else {
          job.tries--;
          if (job.tries === 0) {
            job.cb('');
            cleanupJob(job);
          }
        }
      } catch (error) {
        logError(Severity.error, errorReporter, error as Error);
        job.cb('');
        cleanupJob(job);
      }
    });
    fileList.forEach(async (filetask) => {
      try {
        if (!filetask.cancelRef.current) {
          var file = await checkFile(filetask.taskId);
          if (file) {
            cleanupFile(filetask);
            filetask.cb(file);
          }
        } else {
          filetask.cb(new Error('canceled'));
          cleanupFile(filetask);
        }
      } catch (error: any) {
        logError(Severity.error, errorReporter, error as Error);
        console.log(error);
        filetask.cb(error as Error);
        cleanupFile(filetask);
      }
    });
  };
  const cleanupJob = (job: job) => {
    jobList.splice(jobList.indexOf(job), 1);
    if (jobList.length === 0 && fileList.length === 0) cleanupTimer();
  };
  const cleanupFile = (job: fileTask) => {
    fileList.splice(fileList.indexOf(job), 1);
    if (jobList.length === 0 && fileList.length === 0) cleanupTimer();
  };
  const launchTimer = () => {
    taskTimer.current = setInterval(() => {
      checkNoiseRemovalTasks();
    }, timerDelay);
  };

  return { requestNoiseRemoval, requestFileNoiseRemoval };
};
