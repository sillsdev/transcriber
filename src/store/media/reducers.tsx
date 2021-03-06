import * as type from './types';

export const mediaCleanState: type.IMediaState = {
  loaded: false,
  url: '',
  urlMediaId: '', //mediaid
  trackedTask: '', //passageid
};

const MediaReducers = function (
  state = mediaCleanState,
  action: type.MediaMsgs
): type.IMediaState {
  switch (action.type) {
    case type.FETCH_AUDIO_URL_PENDING:
      return {
        ...state,
        urlMediaId: action.payload,
        loaded: false,
        url: '',
      };
    case type.FETCH_AUDIO_URL:
      return {
        ...state,
        loaded: true,
        url: action.payload,
      };
    case type.SET_SELECTED:
      return {
        ...state,
        trackedTask: action.payload,
      };
    default:
      return { ...state };
  }
};

export default MediaReducers;
