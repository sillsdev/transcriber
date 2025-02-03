import { useGlobal } from '../context/GlobalContext';

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
import { useContext, useRef } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { loadBlobAsync } from './loadBlob';

export enum AudioAiFn {
  noiseRemoval = 'noiseremoval',
  voiceConversion = 'voiceconversion',
}
export interface IRequestAudio {
  fn: AudioAiFn;
  cancelRef: React.MutableRefObject<boolean>;
  file: File;
  targetVoice?: string;
  cb: (file: File | Error) => void;
}

interface fileTask {
  taskId: string;
  cb: (file: File | Error) => void;
  cancelRef: React.MutableRefObject<boolean>;
}
const timerDelay = 10000; //10 seconds

export const useAudioAi = () => {
  const [reporter] = useGlobal('errorReporter');
  const [offline] = useGlobal('offline');
  const [errorReporter] = useGlobal('errorReporter');
  const fileList: fileTask[] = [];
  const returnAsS3List: fileTask[] = [];
  const taskTimer = useRef<NodeJS.Timeout>();
  const token = useContext(TokenContext).state.accessToken;

  const cancelled = new Error('canceled');

  const cleanupTimer = () => {
    if (
      fileList.length === 0 &&
      returnAsS3List.length === 0 &&
      taskTimer.current
    ) {
      try {
        clearInterval(taskTimer.current);
      } catch (error) {
        logError(Severity.error, errorReporter, error as Error);
      }
      taskTimer.current = undefined;
    }
  };

  const cleanupFile = (job: fileTask) => {
    fileList.splice(fileList.indexOf(job), 1);
    cleanupTimer();
  };

  const cleanupS3 = (job: fileTask) => {
    returnAsS3List.splice(returnAsS3List.indexOf(job), 1);
    cleanupTimer();
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

  const checkFile = async (fn: AudioAiFn, task: fileTask) => {
    var response = await axiosGetStream(`aero/${fn}/${task.taskId}`);
    const data = await response?.json();
    if (data) {
      cleanupFile(task);
      return base64ToFile(data.data, data.fileName ?? task.taskId);
    }
    return undefined;
  };

  const checkAsS3 = async (fn: AudioAiFn, task: fileTask) => {
    var url = await axiosGet(`aero/${fn}/s3/${task.taskId}`);
    if (url?.message) {
      cleanupS3(task); //prevent from doing this again before we're done here
      var b = await loadBlobAsync(url?.message);
      if (token) {
        const audioBase = url.message.split('?')[0];
        const filename = audioBase.split('/').pop();
        deleteS3File(filename);
      }
      if (b) return new File([b], task.taskId + '.wav');
      else throw new Error('bloberror');
    }
    return undefined;
  };

  const checkNoiseRemovalTasks = async (fn: AudioAiFn) => {
    fileList.forEach(async (filetask) => {
      try {
        if (!filetask.cancelRef.current) {
          var file = await checkFile(fn, filetask);
          if (file) {
            filetask.cb(file);
          }
        } else {
          filetask.cb(cancelled);
          cleanupFile(filetask);
        }
      } catch (error: any) {
        logError(Severity.error, errorReporter, error as Error);
        console.log(error);
        filetask.cb(error as Error);
        cleanupFile(filetask);
      }
    });
    returnAsS3List.forEach(async (filetask) => {
      try {
        if (!filetask.cancelRef.current) {
          var file = await checkAsS3(fn, filetask);
          if (file) {
            filetask.cb(file);
          }
        } else {
          filetask.cb(cancelled);
          cleanupS3(filetask);
        }
      } catch (error: any) {
        logError(Severity.error, errorReporter, error as Error);
        console.log(error);
        filetask.cb(error as Error);
        cleanupS3(filetask);
      }
    });
  };

  const launchTimer = (fn: AudioAiFn) => {
    taskTimer.current = setInterval(() => {
      checkNoiseRemovalTasks(fn);
    }, timerDelay);
  };

  const deleteS3File = (filename: string) => {
    if (token)
      axiosDelete(`S3Files/AI/${filename}`, token).catch((err) =>
        logError(Severity.error, errorReporter, err)
      );
  };

  const s3request = async (
    fn: AudioAiFn,
    cancelRef: React.MutableRefObject<boolean>,
    file: File,
    targetVoice: string | undefined,
    cb: (file: File | Error) => void
  ) => {
    if (offline || !token) return '';
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
          if (!cancelRef.current)
            axiosGet(`S3Files/get/AI/${file.name}/wav`, undefined, token)
              .then((response) => {
                if (!cancelRef.current)
                  axiosSendSignedUrl(
                    `aero/${fn}/fromfile`,
                    response,
                    targetVoice
                  )
                    .then((nrresponse) => {
                      if (nrresponse.status === HttpStatusCode.Ok) {
                        var taskId = nrresponse.data ?? '';
                        returnAsS3List.push({
                          taskId,
                          cb,
                          cancelRef,
                        });
                        if (!taskTimer.current) launchTimer(fn);
                      } else cb(new Error(response.statusText));
                    })
                    .catch((err) => {
                      logError(Severity.error, errorReporter, err);
                      cb(err as Error);
                    })
                    .finally(() => deleteS3File(file.name));
                else cb(cancelled);
              })
              .catch((err) => {
                logError(Severity.error, errorReporter, err);
                cb(err as Error);
                deleteS3File(file.name);
              });
          else deleteS3File(file.name);
      }
    );
  };

  const requestAudioAi = async ({
    fn,
    cancelRef,
    file,
    targetVoice,
    cb,
  }: IRequestAudio) => {
    if (offline) return '';
    if (file.size > 7500000 || targetVoice)
      s3request(fn, cancelRef, file, targetVoice, cb).catch((err) =>
        cb(err as Error)
      );
    else
      axiosPostFile(`aero/${fn}`, file)
        .then((nrresponse) => {
          if (cancelRef.current) cb(cancelled);
          else if (nrresponse.status === HttpStatusCode.Ok) {
            var taskId = nrresponse.data ?? '';
            fileList.push({
              taskId,
              cb,
              cancelRef,
            });
            if (!taskTimer.current) launchTimer(fn);
          } else if (nrresponse.status === HttpStatusCode.PayloadTooLarge) {
            s3request(fn, cancelRef, file, targetVoice, cb).catch((err) =>
              cb(err as Error)
            );
          } else cb(new Error(nrresponse.statusText));
        })
        .catch((err) => {
          if (
            err.status === HttpStatusCode.PayloadTooLarge ||
            err.message.toString().includes('413')
          ) {
            console.log('payload too large', file.size);

            return s3request(fn, cancelRef, file, targetVoice, cb).catch(
              (err) => cb(err as Error)
            );
          } else cb(err as Error);
        });
  };

  return { requestAudioAi };
};
