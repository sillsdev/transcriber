import Axios from 'axios';
import { FETCH_AUTH_USER  } from './types';
import { API_CONFIG } from '../api-variable';


export const fetchAuthUser = () => (dispatch: any) => {
    Axios.get(API_CONFIG.host + '/api/users/0')
        .then(user => {
            dispatch({
                payload: user,
                type: FETCH_AUTH_USER
            });
        })
}

