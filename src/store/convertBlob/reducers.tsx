import {
  ConvertBlobMsgs,
  CONVERT_BLOB_FAILED,
  CONVERT_BLOB_PENDING,
  CONVERT_BLOB_SUCCEEDED,
  CONVERT_BLOB_RESET,
  IConvertBlobState,
  CONVERT_BLOB_PROGRESS,
} from './types';

export const convertBlobCleanState = {
  guid: '',
  blob: {},
  mimeType: 'audio/ogg;codecs=opus',
  statusmsg: '',
  errmsg: '',
  complete: false,
} as IConvertBlobState;

const convertBlobReducers = function (
  state = convertBlobCleanState,
  action: ConvertBlobMsgs
): IConvertBlobState {
  switch (action.type) {
    case CONVERT_BLOB_RESET:
      return { ...convertBlobCleanState };

    case CONVERT_BLOB_PENDING:
      return {
        ...state,
        guid: action.payload.message,
        statusmsg: action.payload.message,
      };
    case CONVERT_BLOB_PROGRESS:
      return {
        ...state,
        guid: action.payload.message,
        statusmsg: action.payload.toString(),
      };
    case CONVERT_BLOB_SUCCEEDED:
      return {
        ...state,
        complete: true,
        guid: action.payload.guid,
        blob: action.payload.blob,
        errmsg: '',
        statusmsg: '',
      };
    case CONVERT_BLOB_FAILED:
      return {
        ...state,
        complete: true,
        guid: action.payload.guid,
        errmsg: action.payload.message,
      };

    default:
      return { ...state };
  }
};

export default convertBlobReducers;
