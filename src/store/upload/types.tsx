// Describing the shape of the upload's slice of state
export interface IUploadState {
  current: number;
  loaded: boolean;
  files: FileList;
}

// Describing the different ACTION NAMES available
export const UPLOAD_LIST = 'UPLOAD_LIST';
export const UPLOAD_ITEM_PENDING = 'UPLOAD_ITEM_PENDING';
export const UPLOAD_ITEM_CREATED = 'UPLOAD_ITEM_CREATED';
export const UPLOAD_ITEM_SUCCEEDED = 'UPLOAD_ITEM_SUCCEEDED';
export const UPLOAD_ITEM_FAILED = 'UPLOAD_ITEM_FAILED';
export const UPLOAD_COMPLETE = 'UPLOAD_COMPLETE';

interface UploadMsg {
  type: typeof UPLOAD_LIST,
  payload: FileList,
}

interface UploadPendingMsg {
  type: typeof UPLOAD_ITEM_PENDING,
  payload: number,
}

interface UploadSucceededMsg {
  type: typeof UPLOAD_ITEM_SUCCEEDED,
  payload: number,
}

interface UploadFailedMsg {
  type: typeof UPLOAD_ITEM_FAILED,
  payload: number,
}

interface UploadCompleteMsg {
  type: typeof UPLOAD_COMPLETE,
}

export type UploadMsgs = UploadMsg | UploadPendingMsg | UploadSucceededMsg | UploadFailedMsg | UploadCompleteMsg;
