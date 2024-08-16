import { useEffect, useReducer } from 'react';
import { useGlobal } from 'reactn';
import { isElectron } from '../api-variable';
import { remoteIdGuid, remoteId } from '../crud';
import { dataPath, PathType } from '../utils/dataPath';
import { ISharedStrings, MediaFile } from '../model';
import { infoMsg, logError, Severity } from '../utils';
import { useFetchUrlNow } from './useFetchUrlNow';
import { RecordKeyMap } from '@orbit/records';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';
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

export interface IFetchMediaProps {
  id: string;
}

export const useFetchMediaUrl = (reporter?: any) => {
  const [state, dispatch] = useReducer(stateReducer, mediaClean);
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const fetchUrl = useFetchUrlNow();
  const safeURL = async (path: string) => {
    if (!path.startsWith('http')) {
      const start = (await ipc?.isWindows()) ? 8 : 7;
      const url = new URL(`file://${path}`).toString().slice(start);
      return `transcribe-safe://${url}`;
    }
    return path;
  };
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
            var local = { localname: '' };
            const audioUrl =
              mediarec.attributes.audioUrl ??
              mediarec.attributes.s3file ??
              mediarec.attributes.originalFile;
            let path = await dataPath(audioUrl, PathType.MEDIA, local);
            let foundLocal = local.localname === path;
            if (foundLocal || offline) {
              if (!path.startsWith('http')) {
                if (cancelled()) return;
                dispatch({
                  payload: await safeURL(path),
                  type: MediaSt.FETCHED,
                });
                return;
              } else if (offline) {
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
      try {
        fetchUrl({ id: state.remoteId, cancelled }).then((url) => {
          if (url === ts.expiredToken) {
            dispatch({
              payload: ts.expiredToken,
              type: MediaSt.ERROR,
            });
            return;
          }
          if (url)
            safeURL(url).then((path) => {
              dispatch({
                payload: path,
                type: MediaSt.FETCHED,
              });
            });
          else if (cancelled()) return;
          else
            dispatch({
              payload: 'no url',
              type: MediaSt.ERROR,
            });
        });
      } catch (e: any) {
        if (cancelled()) return;
        logError(Severity.error, reporter, infoMsg(e, 'media fetch failure'));
        dispatch({ payload: e.message, type: MediaSt.ERROR });
      }
    };

    fetchData();

    return function cleanup() {
      cancelRequest = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.id]);

  const fetchMediaUrl = (props: IFetchMediaProps) => {
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
