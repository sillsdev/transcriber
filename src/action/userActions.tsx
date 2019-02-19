import { LOGIN_USER } from './types';
import { ICredential } from '../model/state'

export const loginUser = (arg: ICredential) => {
    return {
        payload: arg.email,
        type: LOGIN_USER
    }
}