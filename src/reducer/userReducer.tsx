import { FETCH_AUTH_USER } from '../actions/types';

const initialState = {
    user: null,
    initials: '',
};

export default function (state = initialState, action: any) {
	switch (action.type) {
        case FETCH_AUTH_USER:
            const name = action.payload.data.data.attributes.name as string;
			return {
                user: action.payload.data.data,
                initials: name.trim().split(' ').map((s: string) => s.slice(0,1).toLocaleUpperCase()).join(''),
            };
        default:
            return {...state};
    };
};
