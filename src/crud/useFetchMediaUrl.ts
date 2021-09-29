import { useEffect, useReducer, useRef } from 'react';
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
  'SET_SELECTED',
}

export interface IMediaState {
  status: MediaSt;
  error: null | string;
  url: string; // temporary url
  urlMediaId: string; // media id
  trackedTask: string; // passage id
}
export const mediaClean: IMediaState = {
  status: MediaSt.IDLE,
  error: null,
  url: '',
  urlMediaId: '',
  trackedTask: '',
};

type Action =
  | { type: MediaSt.PENDING; payload: string } // mediaId
  | { type: MediaSt.FETCHED; payload: string } // temporary url
  | { type: MediaSt.ERROR; payload: string }
  | { type: MediaSt.IDLE; payload: undefined }
  | { type: MediaSt.SET_SELECTED; payload: string };

const stateReducer = (state: IMediaState, action: Action): IMediaState => {
  switch (action.type) {
    case MediaSt.PENDING:
      return {
        ...mediaClean,
        status: MediaSt.PENDING,
        urlMediaId: action.payload,
        error: '',
      };
    case MediaSt.FETCHED:
      return {
        ...state,
        status: MediaSt.FETCHED,
        url: action.payload,
      };
    case MediaSt.ERROR:
      return { ...state, status: MediaSt.ERROR, error: action.payload };
    case MediaSt.IDLE:
      return { ...state, status: MediaSt.IDLE, urlMediaId: '', error: '' };
    case MediaSt.SET_SELECTED:
      return { ...state, trackedTask: action.payload };
    default:
      return state;
  }
};

interface IProps {
  id: string;
  auth: Auth | null;
}
const clean: IProps = {
  id: '',
  auth: null,
};

export const useFetchMediaUrl = (reporter?: any) => {
  const props = useRef<IProps>(clean);
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

  useEffect(() => {
    let cancelRequest = false;
    let id = props.current.id;
    if (!id) return;

    const cancelled = () => {
      if (cancelRequest) {
        dispatch({ payload: undefined, type: MediaSt.IDLE });
        return true;
      }
      return false;
    };

    const fetchData = () => {
      const remoteid = remId(id);
      id = guidId(id);
      if (cancelled()) return;
      dispatch({ payload: id, type: MediaSt.PENDING });

      if (isElectron) {
        try {
          if (cancelled()) return;
          const mediarec = memory.cache.query((q) =>
            q.findRecord({
              type: 'mediafile',
              id: id,
            })
          ) as MediaFile;
          if (mediarec && mediarec.attributes) {
            if (cancelled()) return;
            const audioUrl = mediarec.attributes.audioUrl;
            const path = dataPath(audioUrl, PathType.MEDIA);
            logError(Severity.info, reporter, `fetching=${path}`);
            if (!path.startsWith('http')) {
              const start = os.platform() === 'win32' ? 8 : 7;
              const url = new URL(`file://${path}`).toString().slice(start);
              const safeUrl = `transcribe-safe://${url}`;
              if (cancelled()) return;
              dispatch({ payload: safeUrl, type: MediaSt.FETCHED });
              return;
            } else if (!props.current.auth || !props.current.auth.accessToken) {
              console.log(
                'media fetch failure: offline trying to access online file'
              );
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
      Axios.get(`${API_CONFIG.host}/api/mediafiles/${remoteid}/fileurl`, {
        headers: {
          Authorization: 'Bearer ' + props.current.auth?.accessToken,
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
  }, [props.current]);

  const fetchMediaUrl = (aProps: IProps) => {
    props.current = { ...aProps };
  };
  const setTrackedTask = (val: string) => (dispatch: any) => {
    dispatch({ payload: val, type: MediaSt.SET_SELECTED });
  };
  return { fetchMediaUrl, mediaState: state, setTrackedTask };
};

export default useFetchMediaUrl;
