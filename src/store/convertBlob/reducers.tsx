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
        statusmsg: action.payload,
      };
    case CONVERT_BLOB_PROGRESS:
      return {
        ...state,
        statusmsg: action.payload.toString(),
      };
    case CONVERT_BLOB_SUCCEEDED:
      return {
        ...state,
        complete: true,
        blob: action.payload,
        errmsg: '',
        statusmsg: '',
      };
    case CONVERT_BLOB_FAILED:
      return {
        ...state,
        complete: true,
        errmsg: action.payload,
      };

    default:
      return { ...state };
  }
};

export default convertBlobReducers;
