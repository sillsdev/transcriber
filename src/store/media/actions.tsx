import Axios from 'axios';
import { API_CONFIG, isElectron } from '../../api-variable';
import Auth from '../../auth/Auth';
import * as type from './types';
import MemorySource from '@orbit/memory';
import { remoteIdGuid, remoteId } from '../../crud';
import { dataPath, PathType } from '../../utils/dataPath';
import { MediaFile } from '../../model';
import { infoMsg, logError, Severity } from '../../utils';
const os = require('os');

export const fetchMediaUrl =
  (
    id: string,
    memory: MemorySource,
    offline: boolean,
    auth: Auth,
    reporter?: any
  ) =>
  (dispatch: any) => {
    if (!id) return;
    var remoteid = id;
    if (!isNaN(Number(id))) id = remoteIdGuid('mediafile', id, memory.keyMap);
    console.log('fetching url for mediaId', id);
    dispatch({ payload: id, type: type.FETCH_AUDIO_URL_PENDING });

    if (isElectron) {
      if (!isNaN(Number(id))) id = remoteIdGuid('mediafile', id, memory.keyMap);
      try {
        var mediarec = memory.cache.query((q) =>
          q.findRecord({
            type: 'mediafile',
            id: id,
          })
        ) as MediaFile;
        if (mediarec && mediarec.attributes) {
          logError(
            Severity.info,
            reporter,
            `fetching=${dataPath(mediarec.attributes.audioUrl, PathType.MEDIA)}`
          );
          var path = dataPath(mediarec.attributes.audioUrl, PathType.MEDIA);
          if (!path.startsWith('http')) {
            const start = os.platform() === 'win32' ? 8 : 7;
            const url = new URL(`file://${path}`).toString().slice(start);
            dispatch({
              payload: `transcribe-safe://${url}`,
              type: type.FETCH_AUDIO_URL,
            });
            return;
          }
        }
      } catch (ex) {
        //we don't have it in our keymap?
        console.log(ex);
        logError(Severity.error, reporter, infoMsg(ex, ''));
      }
    }
    if (isNaN(Number(remoteid)))
      remoteid = remoteId('mediafile', id, memory.keyMap);
    Axios.get(API_CONFIG.host + '/api/mediafiles/' + remoteid + '/fileurl', {
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
  };

export const setTrackedTask = (val: string) => (dispatch: any) => {
  dispatch({ payload: val, type: type.SET_SELECTED });
};
