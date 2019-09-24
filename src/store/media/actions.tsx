import Axios from 'axios';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import * as type from './types';

export const fetchMediaUrl = (id: string, auth: Auth) => (dispatch: any) => {
  dispatch({ type: type.FETCH_AUDIO_URL_PENDING });
  Axios.get(API_CONFIG.host + '/api/mediafiles/' + id + '/fileurl', {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  }).then(strings => {
    dispatch({
      payload: strings,
      type: type.FETCH_AUDIO_URL,
    });
  });
};
