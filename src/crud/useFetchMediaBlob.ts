import { useEffect, useReducer, useState } from 'react';
import useFetchMediaUrl, { IMediaState, mediaClean } from './useFetchMediaUrl';
import { useGlobal } from '../context/GlobalContext';
import { loadBlob } from '../utils/loadBlob';

export enum BlobStatus {
  'IDLE',
  'PENDING',
  'RESET', // 403 when getting blob
  'FETCHED',
  'ERROR',
}
export interface IBlobState extends IMediaState {
  blob: Blob;
  blobStat: BlobStatus;
}

export const blobClean = {
  ...mediaClean,
  blob: new Blob(),
  blobStat: BlobStatus.IDLE,
};

interface IFetched {
  url: string;
  blob: Blob;
}

type Action =
  | { type: BlobStatus.PENDING; payload: IMediaState } // mediaId
  | { type: BlobStatus.FETCHED; payload: IFetched }
  | { type: BlobStatus.RESET; payload: IMediaState }
  | { type: BlobStatus.ERROR; payload: string }
  | { type: BlobStatus.IDLE; payload: undefined };

const stateReducer = (state: IBlobState, action: Action): IBlobState => {
  switch (action?.type) {
    case BlobStatus.PENDING:
      return {
        ...blobClean,
        ...action.payload,
        blobStat: BlobStatus.PENDING,
        error: '',
      };
    case BlobStatus.RESET:
      return {
        ...blobClean,
        ...action.payload,
        blobStat: BlobStatus.RESET,
      };
    case BlobStatus.FETCHED:
      return {
        ...state,
        blobStat: BlobStatus.FETCHED,
        url: action.payload.url,
        blob: action.payload.blob,
      };
    case BlobStatus.ERROR:
      return {
        ...state,
        blobStat: BlobStatus.ERROR,
        error: action.payload + ' ' + state.id,
      };
    case BlobStatus.IDLE:
      return { ...blobClean, blobStat: BlobStatus.IDLE };

    default:
      return state;
  }
};

export const useFetchMediaBlob = () => {
  const [reporter] = useGlobal('errorReporter');
  const [mediaId, setMediaId] = useState('');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [state, dispatch] = useReducer(stateReducer, blobClean);

  const fetchBlob = (url: string) => {
    setMediaId(url);
  };

  type retValue = [IBlobState, typeof fetchBlob];

  useEffect(() => {
    fetchMediaUrl({ id: mediaId });
    dispatch({
      type: BlobStatus.PENDING,
      payload: { ...mediaState, id: mediaId },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    if (state.blobStat === BlobStatus.PENDING && mediaState.url) {
      try {
        loadBlob(mediaState.url, (urlOrError, blob) => {
          if (!blob) {
            if (urlOrError.includes('403')) {
              fetchMediaUrl({ id: '' });
              dispatch({ type: BlobStatus.RESET, payload: mediaState });
            } else {
              dispatch({ type: BlobStatus.ERROR, payload: urlOrError });
            }
            return;
          }
          // we have a blob blob
          if (blob.type !== 'text/html' && blob.type !== 'application/xml') {
            const url = urlOrError;
            dispatch({ type: BlobStatus.FETCHED, payload: { url, blob } });
          }
        });
      } catch (error: any) {
        dispatch({ type: BlobStatus.ERROR, payload: error.message });
      }
    } else if (state.blobStat === BlobStatus.RESET) {
      fetchMediaUrl({ id: mediaId });
      dispatch({
        type: BlobStatus.PENDING,
        payload: { ...mediaState, id: mediaId },
      });
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState.url]);

  return [state, fetchBlob] as retValue;
};
