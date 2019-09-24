import {
  UPLOAD_LIST,
  UPLOAD_ITEM_PENDING,
  UPLOAD_ITEM_SUCCEEDED,
  UPLOAD_ITEM_FAILED,
  UPLOAD_COMPLETE,
  UploadMsgs,
  IUploadState,
} from './types';

export const uploadCleanState = {
  current: 0,
  loaded: false,
  files: [] as any,
};

export default function(state = uploadCleanState, action: UploadMsgs): IUploadState {
  switch (action.type) {
    case UPLOAD_LIST:
      return {
        ...state,
        current: -1,
        loaded: false,
        files: action.payload,
      };
    case UPLOAD_ITEM_PENDING:
      return {
        ...state,
        loaded: false,
        current: action.payload,
      };
    case UPLOAD_ITEM_SUCCEEDED:
      return {
        ...state,
        loaded: true,
        current: action.payload,
      };
    case UPLOAD_ITEM_FAILED:
      return {
        ...state,
      };
    case UPLOAD_COMPLETE:
      return {
        ...state,
        current: 0,
        files: [] as any,
        loaded: false,
      };
    default:
      return { ...state };
  }
}
