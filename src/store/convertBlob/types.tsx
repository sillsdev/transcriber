// Describing the shape of the Ogg slice of state
export interface IConvertBlobState {
  guid: string;
  blob: Blob;
  mimeType: string;
  statusmsg: string;
  errmsg: string;
  complete: boolean;
}
interface ConvertMsg {
  guid: string;
  message: string;
}
interface ConvertBlob {
  guid: string;
  blob: Blob;
}
// Describing the different ACTION NAMES available
export const CONVERT_BLOB_PENDING = 'CONVERT_BLOB_PENDING';
export const CONVERT_BLOB_FAILED = 'CONVERT_BLOB_FAILED';
export const CONVERT_BLOB_SUCCEEDED = 'CONVERT_BLOB_SUCCEEDED';
export const CONVERT_BLOB_PROGRESS = 'CONVERT_BLOB_PROGRESS';
export const CONVERT_BLOB_RESET = 'CONVERT_BLOB_RESET';

interface ConvertBlobPendingMsg {
  type: typeof CONVERT_BLOB_PENDING;
  payload: ConvertMsg;
}
interface ConvertBlobProgressMsg {
  type: typeof CONVERT_BLOB_PROGRESS;
  payload: ConvertMsg;
}
interface ConvertBlobSucceededMsg {
  type: typeof CONVERT_BLOB_SUCCEEDED;
  payload: ConvertBlob;
}

interface ConvertBlobFailedMsg {
  type: typeof CONVERT_BLOB_FAILED;
  payload: ConvertMsg;
}
interface ConvertBlobResetMsg {
  type: typeof CONVERT_BLOB_RESET;
  payload: ConvertMsg;
}
export type ConvertBlobMsgs =
  | ConvertBlobPendingMsg
  | ConvertBlobProgressMsg
  | ConvertBlobSucceededMsg
  | ConvertBlobFailedMsg
  | ConvertBlobResetMsg;
