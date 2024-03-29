import { appPath } from '../../utils';
import {
  CONVERT_BLOB_PENDING,
  CONVERT_BLOB_SUCCEEDED,
  CONVERT_BLOB_RESET,
  CONVERT_BLOB_FAILED,
  CONVERT_BLOB_PROGRESS,
} from './types';

export const resetConvertBlob = () => (dispatch: any) => {
  dispatch({ payload: '', type: CONVERT_BLOB_RESET });
};

export const convertBlob =
  (audioBlob: Blob, mimeType: string, guid: string) => (dispatch: any) => {
    const fakeSourceName = 'fname.wav';
    const fakeOggName = 'encoded.ogg';
    dispatch({
      payload: { guid: guid, message: '' },
      type: CONVERT_BLOB_PENDING,
    });
    // Convert to ogg
    var worker: Worker | undefined = undefined;
    var blobData: ArrayBuffer | string | null;
    var fileReader = new FileReader();
    fileReader.onload = function () {
      blobData = this.result;
      postMessage();
    };

    fileReader.readAsArrayBuffer(audioBlob);

    const postMessage = () => {
      if (worker && blobData) {
        var inData = {} as any;
        inData[fakeSourceName] = new Uint8Array(blobData as ArrayBuffer);
        var outData = {} as any;
        outData[fakeOggName] = { MIME: mimeType };

        worker.postMessage({
          command: 'encode',
          args: [fakeSourceName, fakeOggName],
          outData: outData,
          fileData: inData,
        });
      }
    };
    if (!worker) {
      worker = new window.Worker(appPath() + '/worker/EmsWorkerProxy.js');
    }
    worker.onmessage = function (event) {
      /* expected messaged from OpusEncoder 'done', 'progress','log', 'err' */
      var message = event.data;
      if (message.reply === 'progress') {
        if (message.values[1]) {
          dispatch({
            payload: {
              guid: guid,
              message: (message.values[0] / message.values[1]) * 100,
            },
            type: CONVERT_BLOB_PROGRESS,
          });
        }
      } else if (message.reply === 'err') {
        dispatch({
          payload: { guid: guid, message: message.values.toString() },
          type: CONVERT_BLOB_FAILED,
        });
      } else if (message.reply === 'done') {
        var result = message.values[fakeOggName];
        dispatch({
          payload: { guid: guid, blob: result.blob },
          type: CONVERT_BLOB_SUCCEEDED,
        });
        worker?.terminate();
        worker = undefined;
      }
    };
  };
