import { initialState as SchemeState } from '../reducer/schemeReducer';

export interface IState {
    user: {
        email: string;
    }
    scheme: typeof SchemeState;
}

export interface ICredential {
    email: string;
    password: string;
}