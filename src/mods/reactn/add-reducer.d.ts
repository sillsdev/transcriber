import { State, Reducers } from '../default';
import Reducer, { AdditionalReducers } from '../types/reducer';
import GlobalStateManager from './global-state-manager';
export default function _addReducer<G extends {} = State, R extends {} = Reducers, ReducerName extends keyof R = keyof R>(globalStateManager: GlobalStateManager<G, R>, name: ReducerName, reducer: R[ReducerName]): any;
export default function _addReducer<G extends {} = State, R extends {} = Reducers>(globalStateManager: GlobalStateManager<G, R>, name: string, reducer: Reducer<G, R & AdditionalReducers<G, R>>): any;
