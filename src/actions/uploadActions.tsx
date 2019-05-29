import Axios from 'axios';
import { API_CONFIG } from '../api-variable';
import Auth from '../auth/Auth';
import { UPLOAD_LIST, UPLOAD_ITEM_PENDING, UPLOAD_ITEM_SUCCEEDED, UPLOAD_ITEM_FAILED } from './types';

export const uploadFiles = (files: Array<any>) => (dispatch: any) => {
    dispatch({
        payload: files,
        type: UPLOAD_LIST
    });
}

export const nextUpload = (record: string, files: Array<any>, n: number, auth: Auth) => (dispatch: any) => {
    const data = new FormData();
    data.append('jsonString', record);
    data.append('file', files[n])
    dispatch({ payload: n, type: UPLOAD_ITEM_PENDING })
    Axios.post(API_CONFIG.host + '/api/mediafiles/file', data, {
        headers: {
            Authorization: 'Bearer ' + auth.accessToken,
        }
    })
        .then(() => {
            // console.log("upload " + files[n].name + " succeeded.")
            dispatch({ payload: n, type: UPLOAD_ITEM_SUCCEEDED })
        })
        .then(() => {
            // console.log("upload " + files[n].name + " failed.")
            dispatch({ payload: n, type: UPLOAD_ITEM_FAILED })
        })
}
