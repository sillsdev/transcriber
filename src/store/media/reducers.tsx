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
      const attr: any = action.payload.data.data.attributes;
      console.log(attr['audio-url']);
      return {
        loaded: true,
        url: attr['audio-url'],
      };
    default:
      return { ...state };
  }
}
