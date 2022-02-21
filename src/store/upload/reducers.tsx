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
  current: -1,
  loaded: false,
  files: [] as any,
  success: [] as boolean[],
  errmsg: '',
};

const UploadReducers = function (
  state = uploadCleanState,
  action: UploadMsgs
): IUploadState {
  switch (action.type) {
    case UPLOAD_LIST:
      return {
        ...state,
        current: -1,
        loaded: false,
        files: action.payload,
        success:
          action.payload.length > 0
            ? [...Array(action.payload.length)].map((u) => false)
            : [],
        errmsg: '',
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
        success: state.success.map((v, ix) =>
          ix === action.payload ? true : v || false
        ),
      };
    case UPLOAD_ITEM_FAILED:
      return {
        ...state,
        loaded: true,
        current: action.payload.current,
        errmsg: action.payload?.error || '',
        success: state.success.map((v, ix) =>
          ix === action.payload.current ? false : v || false
        ),
      };
    case UPLOAD_COMPLETE:
      return {
        ...state,
        current: -2,
        files: [] as any,
        errmsg: '',
        loaded: false,
      };
    default:
      return { ...state };
  }
};

export default UploadReducers;
