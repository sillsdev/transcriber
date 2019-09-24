import { MediaFile } from '../../model';

// Describing the shape of the book names's slice of state
export interface IMediaState {
  url: string;
  loaded: boolean;
}

// Describing the different ACTION NAMES available
export const FETCH_AUDIO_URL = 'FETCH_AUDIO_URL';
export const FETCH_AUDIO_URL_PENDING = 'FETCH_AUDIO_URL_PENDING';

interface FetchMediaUrlPending {
  type: typeof FETCH_AUDIO_URL_PENDING;
}

interface FetchAudioUrl {
  type: typeof FETCH_AUDIO_URL;
  payload: { data: { data: MediaFile } };
}

export type MediaMsgs = FetchAudioUrl | FetchMediaUrlPending;
