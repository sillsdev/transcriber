import { ITask } from '../model/task';
import { FETCH_TASK_FULFILLED, FETCH_TASK_PENDING } from '../action/types';

export const initialState = {
    loaded: false,
    task: Array<ITask>(),
}

export default function (state = initialState, action: any) : typeof initialState {
    switch (action.type) {
        case FETCH_TASK_PENDING:
            return {
                ...state,
                loaded: false,
            }
        case FETCH_TASK_FULFILLED:
            return {
                ...state,
                loaded: true,
                task: action.payload.data,
            }
        default:
            return state;
    }
}