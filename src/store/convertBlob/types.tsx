// Describing the shape of the Ogg slice of state
export interface IConvertBlobState {
  blob: Blob;
  mimeType: string;
  statusmsg: string;
  errmsg: string;
  complete: boolean;
}

// Describing the different ACTION NAMES available
export const CONVERT_BLOB_PENDING = 'CONVERT_BLOB_PENDING';
export const CONVERT_BLOB_FAILED = 'CONVERT_BLOB_FAILED';
export const CONVERT_BLOB_SUCCEEDED = 'CONVERT_BLOB_SUCCEEDED';
export const CONVERT_BLOB_PROGRESS = 'CONVERT_BLOB_PROGRESS';
export const CONVERT_BLOB_RESET = 'CONVERT_BLOB_RESET';

interface ConvertBlobPendingMsg {
  type: typeof CONVERT_BLOB_PENDING;
  payload: string;
}
interface ConvertBlobProgressMsg {
  type: typeof CONVERT_BLOB_PROGRESS;
  payload: number;
}
interface ConvertBlobSucceededMsg {
  type: typeof CONVERT_BLOB_SUCCEEDED;
  payload: Blob;
}

interface ConvertBlobFailedMsg {
  type: typeof CONVERT_BLOB_FAILED;
  payload: string;
}
interface ConvertBlobResetMsg {
  type: typeof CONVERT_BLOB_RESET;
  payload: string;
}
export type ConvertBlobMsgs =
  | ConvertBlobPendingMsg
  | ConvertBlobProgressMsg
  | ConvertBlobSucceededMsg
  | ConvertBlobFailedMsg
  | ConvertBlobResetMsg;
