import { LOGIN_USER } from '../action/types';

const initialState = {
    email: "",
};

export default function (state = initialState, action: any) {
    switch (action.type) {
        case LOGIN_USER:
            return {
                ...state,
                email: action.payload
            }
        default:
            return state;
    }
}