import * as type from './types';

export const mediaCleanState = {
  loaded: false,
  url: '',
};

export default function(
  state = mediaCleanState,
  action: type.MediaMsgs
): type.IMediaState {
  switch (action.type) {
    case type.FETCH_AUDIO_URL_PENDING:
      return mediaCleanState;
    case type.FETCH_AUDIO_URL:
      return {
        loaded: true,
        url: action.payload,
      };
    default:
      return { ...state };
  }
}
