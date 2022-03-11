import { useEffect, useReducer } from 'react';
import { useGlobal } from 'reactn';
import Axios from 'axios';
import { API_CONFIG, isElectron } from '../api-variable';
import Auth from '../auth/Auth';
import { remoteIdGuid, remoteId } from '../crud';
import { dataPath, PathType } from '../utils/dataPath';
import { MediaFile } from '../model';
import { infoMsg, logError, Severity } from '../utils';
const os = require('os');
// See: https://www.smashingmagazine.com/2020/07/custom-react-hook-fetch-cache-data/

export enum MediaSt {
  'IDLE',
  'PENDING',
  'FETCHED',
  'ERROR',
}

export interface IMediaState {
  status: MediaSt;
  error: null | string;
  url: string; // temporary url
  id: string; // media id
  remoteId: string;
  auth: Auth | null;
  cancelled: boolean;
}
export const mediaClean: IMediaState = {
  status: MediaSt.IDLE,
  error: null,
  url: '',
  id: '',
  remoteId: '',
  auth: null,
  cancelled: false,
};

type Action =
  | { type: MediaSt.PENDING; payload: IMediaState } // mediaId
  | { type: MediaSt.FETCHED; payload: string } // temporary url
  | { type: MediaSt.ERROR; payload: string }
  | { type: MediaSt.IDLE; payload: undefined };

const stateReducer = (state: IMediaState, action: Action): IMediaState => {
  switch (action.type) {
    case MediaSt.PENDING:
      return {
        ...mediaClean,
        ...action.payload,
        status: MediaSt.PENDING,
        error: '',
      };
    case MediaSt.FETCHED:
      return {
        ...state,
        status: MediaSt.FETCHED,
        url: action.payload,
      };
    case MediaSt.ERROR:
      return {
        ...state,
        status: MediaSt.ERROR,
        error: action.payload + ' ' + state.id,
      };
    case MediaSt.IDLE:
      return { ...mediaClean, status: MediaSt.IDLE };

    default:
      return state;
  }
};

interface IProps {
  id: string;
  auth: Auth | null;
}

export const useFetchMediaUrl = (reporter?: any) => {
  const [state, dispatch] = useReducer(stateReducer, mediaClean);
  const [memory] = useGlobal('memory');

  const guidId = (id: string) => {
    return !isNaN(Number(id))
      ? remoteIdGuid('mediafile', id, memory.keyMap)
      : id;
  };

  const remId = (id: string) => {
    return isNaN(Number(id)) ? remoteId('mediafile', id, memory.keyMap) : id;
  };

  const safeURL = (path: string) => {
    if (!path.startsWith('http')) {
      const start = os.platform() === 'win32' ? 8 : 7;
      const url = new URL(`file://${path}`).toString().slice(start);
      return `transcribe-safe://${url}`;
    }
    return path;
  };

  useEffect(() => {
    let cancelRequest = false;
    if (!state.id) return;

    const cancelled = () => {
      if (cancelRequest) {
        dispatch({ payload: undefined, type: MediaSt.IDLE });
        return true;
      }
      return false;
    };

    const fetchData = () => {
      if (isElectron) {
        try {
          if (cancelled()) return;
          const mediarec = memory.cache.query((q) =>
            q.findRecord({
              type: 'mediafile',
              id: state.id,
            })
          ) as MediaFile;
          if (mediarec && mediarec.attributes) {
            if (cancelled()) return;
            const audioUrl = mediarec.attributes.audioUrl;
            const path = dataPath(audioUrl, PathType.MEDIA);
            if (!path.startsWith('http')) {
              if (cancelled()) return;
              dispatch({ payload: safeURL(path), type: MediaSt.FETCHED });
              return;
            } else if (!state.auth?.accessToken) {
              dispatch({
                payload: 'no offline file',
                type: MediaSt.ERROR,
              });
              return;
            }
          }
        } catch (e: any) {
          if (cancelled()) return;
          // we don't have it in our keymap?
          logError(Severity.error, reporter, infoMsg(e, ''));
          dispatch({ payload: e.message, type: MediaSt.ERROR });
        }
      }
      if (cancelled()) return;
      Axios.get(`${API_CONFIG.host}/api/mediafiles/${state.remoteId}/fileurl`, {
        headers: {
          Authorization: 'Bearer ' + state.auth?.accessToken,
        },
      })
        .then((strings) => {
          const attr: any = strings.data.data.attributes;
          if (cancelled()) return;
          dispatch({ payload: attr['audio-url'], type: MediaSt.FETCHED });
        })
        .catch((e) => {
          if (cancelled()) return;
          logError(Severity.error, reporter, infoMsg(e, 'media fetch failure'));
          dispatch({ payload: e.message, type: MediaSt.ERROR });
        });
    };

    fetchData();

    return function cleanup() {
      cancelRequest = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.id]);

  const fetchMediaUrl = (props: IProps) => {
    let { id, auth } = props;
    const remoteId = remId(id);
    id = guidId(id);
    dispatch({
      payload: { ...mediaClean, id, remoteId, auth },
      type: MediaSt.PENDING,
    });
  };

  return { fetchMediaUrl, safeURL, mediaState: state };
};

export default useFetchMediaUrl;
