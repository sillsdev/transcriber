// Describing the shape of the media slice of state
export interface IMediaState {
  url: string;
  loaded: boolean;
  trackedTask: string;
}

// Describing the different ACTION NAMES available
export const FETCH_AUDIO_URL = 'FETCH_AUDIO_URL';
export const FETCH_AUDIO_URL_PENDING = 'FETCH_AUDIO_URL_PENDING';
export const SET_SELECTED = 'SET_SELECTED';

interface FetchMediaUrlPending {
  type: typeof FETCH_AUDIO_URL_PENDING;
}

interface FetchAudioUrl {
  type: typeof FETCH_AUDIO_URL;
  payload: string;
}

interface SetSeclected {
  type: typeof SET_SELECTED;
  payload: string;
}

export type MediaMsgs = FetchAudioUrl | FetchMediaUrlPending | SetSeclected;
