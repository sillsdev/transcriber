import Axios from 'axios';
import { FETCH_SCHEME_FULFILLED, FETCH_SCHEME_PENDING } from './types';

export const fetchScheme = () => (dispatch: any) => {
    dispatch({type: FETCH_SCHEME_PENDING})
    Axios.get('/api/GetScheme')
        .then(scheme => {
            dispatch({
                payload: scheme,
                type: FETCH_SCHEME_FULFILLED
            });
        })
}