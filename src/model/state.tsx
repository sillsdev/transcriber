import { initialState as SchemeState } from '../reducer/schemeReducer';
import { initialState as TaskState } from '../reducer/taskReducer';

export interface IState {
    user: {
        email: string;
    }
    scheme: typeof SchemeState;
    task: typeof TaskState;
}

export interface ICredential {
    email: string;
    password: string;
}