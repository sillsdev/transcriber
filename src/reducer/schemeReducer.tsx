import { IScheme } from '../model/scheme';
import { FETCH_SCHEME_FULFILLED, FETCH_SCHEME_PENDING } from '../action/types';

export const initialState = {
    loaded: false,
    scheme: Array<IScheme>(),
}

export default function (state = initialState, action: any) : typeof initialState {
    switch (action.type) {
        case FETCH_SCHEME_PENDING:
            return {
                ...state,
                loaded: false,
            }
        case FETCH_SCHEME_FULFILLED:
            return {
                ...state,
                loaded: true,
                scheme: action.payload.data,
            }
        default:
            return state;
    }
}