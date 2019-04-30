import Axios from 'axios';
import { FETCH_AUTH_USER  } from './types';
import { API_CONFIG } from '../api-variable';
import Auth from '../auth/Auth';


export const fetchAuthUser = (auth: Auth) => (dispatch: any) => {
    Axios({
        method: 'GET',
        url: API_CONFIG.host + '/api/users/0',
        headers: {
            Authorization: 'Bearer ' + auth.accessToken,
            Accept: 'application/vnd.api+json',
        },
    })
        .then(user => {
            dispatch({
                payload: user,
                type: FETCH_AUTH_USER
            });
        })
}

