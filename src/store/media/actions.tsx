import Axios from 'axios';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import * as type from './types';
import MemorySource from '@orbit/memory';
import { remoteIdGuid, remoteId } from '../../crud';
import { dataPath, PathType } from '../../utils/dataPath';
import { MediaFile } from '../../model';

export const fetchMediaUrl = (
  id: string,
  memory: MemorySource,
  offline: boolean,
  auth: Auth
) => (dispatch: any) => {
  dispatch({ type: type.FETCH_AUDIO_URL_PENDING });
  if (offline) {
    if (!isNaN(Number(id))) id = remoteIdGuid('mediafile', id, memory.keyMap);
    try {
      var mediarec = memory.cache.query((q) =>
        q.findRecord({
          type: 'mediafile',
          id: id,
        })
      ) as MediaFile;
      if (mediarec && mediarec.attributes) {
        dispatch({
          payload: dataPath(mediarec.attributes.audioUrl, PathType.MEDIA),
          type: type.FETCH_AUDIO_URL,
        });
      }
    } catch (ex) {
      //we don't have it in our keymap?
      console.log(ex);
    }
  } else {
    if (isNaN(Number(id))) id = remoteId('mediafile', id, memory.keyMap);
    Axios.get(API_CONFIG.host + '/api/mediafiles/' + id + '/fileurl', {
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
    })
      .then((strings) => {
        const attr: any = strings.data.data.attributes;
        dispatch({
          payload: attr['audio-url'],
          type: type.FETCH_AUDIO_URL,
        });
      })
      .catch((e) => {
        console.log('media fetch failure: ' + e.message);
      });
  }
};

export const setTrackedTask = (val: string) => (dispatch: any) => {
  dispatch({ payload: val, type: type.SET_SELECTED });
};
