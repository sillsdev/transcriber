import Axios from 'axios';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import * as type from './types';
import MemorySource from '@orbit/memory';
import { remoteIdGuid } from '../../utils';
import { isArray } from 'util';
import { DataPath } from '../../utils/DataPath';

export const fetchMediaUrl = (
  id: string,
  memory: MemorySource,
  offline: boolean,
  auth: Auth
) => (dispatch: any) => {
  dispatch({ type: type.FETCH_AUDIO_URL_PENDING });
  if (offline) {
    var mediarec = memory.cache.query(q =>
      q.findRecord({
        type: 'mediafile',
        id: remoteIdGuid('mediafile', id, memory.keyMap),
      })
    );
    if (isArray(mediarec)) mediarec = mediarec[0];
    if (mediarec && mediarec.attributes) {
      dispatch({
        payload: DataPath(mediarec.attributes.audioUrl),
        type: type.FETCH_AUDIO_URL,
      });
    }
  } else {
    Axios.get(API_CONFIG.host + '/api/mediafiles/' + id + '/fileurl', {
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
    })
      .then(strings => {
        const attr: any = strings.data.data.attributes;
        dispatch({
          payload: attr['audio-url'],
          type: type.FETCH_AUDIO_URL,
        });
      })
      .catch(e => {
        console.log('media fetch failure: ' + e.message);
      });
  }
};

export const setSelected = (val: string) => (dispatch: any) => {
  dispatch({ payload: val, type: type.SET_SELECTED });
};
