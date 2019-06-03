import {
    UPLOAD_LIST,
    UPLOAD_ITEM_PENDING,
    UPLOAD_ITEM_SUCCEEDED,
    UPLOAD_ITEM_FAILED
} from '../actions/types';

const initialState = {
    current: 0,
    loaded: false,
    files: [],
};

export default function (state = initialState, action: any) {
	switch (action.type) {
		case UPLOAD_LIST:
			return {
                ...state,
                current: -1,
                loaded: false,
                files: action.payload,
            };
        case UPLOAD_ITEM_PENDING:
            return {
                ...state,
                loaded: false,
                current: action.payload,
            }
        case UPLOAD_ITEM_SUCCEEDED:
            return {
                ...state,
                loaded: true,
                current: action.payload,
            }
        case UPLOAD_ITEM_FAILED:
            return {
                ...state
            }
        default:
            return {...state};
    };
};
