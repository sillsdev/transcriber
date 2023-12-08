import { useEffect, useReducer, useContext } from 'react';
import { useGlobal } from 'reactn';
import Axios from 'axios';
import { API_CONFIG, isElectron } from '../api-variable';
import { TokenContext } from '../context/TokenProvider';
import { remoteIdGuid, remoteId } from '../crud';
import { dataPath, PathType } from '../utils/dataPath';
import { MediaFile } from '../model';
import { infoMsg, logError, Severity } from '../utils';
import { RecordKeyMap } from '@orbit/records';
const ipc = (window as any)?.electron;
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
  cancelled: boolean;
}
export const mediaClean: IMediaState = {
  status: MediaSt.IDLE,
  error: null,
  url: '',
  id: '',
  remoteId: '',
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
}

export const useFetchMediaUrl = (reporter?: any) => {
  const [state, dispatch] = useReducer(stateReducer, mediaClean);
  const [memory] = useGlobal('memory');
  const { accessToken } = useContext(TokenContext).state;

  const guidId = (id: string) => {
    return !isNaN(Number(id))
      ? (remoteIdGuid('mediafile', id, memory.keyMap as RecordKeyMap) as string)
      : id;
  };

  const remId = (id: string) => {
    return isNaN(Number(id))
      ? (remoteId('mediafile', id, memory.keyMap as RecordKeyMap) as string)
      : id;
  };

  const safeURL = async (path: string) => {
    if (!path.startsWith('http')) {
      const start = (await ipc?.isWindows()) ? 8 : 7;
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
        // setting to idle here clears the fetched url when component refreshed
        // dispatch({ payload: undefined, type: MediaSt.IDLE });
        return true;
      }
      return false;
    };

    const fetchData = async () => {
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
            const audioUrl =
              mediarec.attributes.audioUrl ??
              mediarec.attributes.s3file ??
              mediarec.attributes.originalFile;
            const path = dataPath(audioUrl, PathType.MEDIA);
            const foundLocal = await ipc?.exists(path);
            if (foundLocal || !accessToken) {
              if (!path.startsWith('http')) {
                if (cancelled()) return;
                dispatch({
                  payload: await safeURL(path),
                  type: MediaSt.FETCHED,
                });
                return;
              } else if (!accessToken) {
                dispatch({
                  payload: 'no offline file',
                  type: MediaSt.ERROR,
                });
                return;
              }
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
          Authorization: 'Bearer ' + accessToken,
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
    let { id } = props;
    if (!id) {
      dispatch({ payload: undefined, type: MediaSt.IDLE });
      return;
    }
    const remoteId = remId(id);
    id = guidId(id);
    dispatch({
      payload: { ...mediaClean, id, remoteId },
      type: MediaSt.PENDING,
    });
  };

  return { fetchMediaUrl, safeURL, mediaState: state };
};

export default useFetchMediaUrl;
