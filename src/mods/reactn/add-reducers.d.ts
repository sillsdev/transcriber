import { Reducers, State } from '../default';
import { AdditionalReducers } from '../types/reducer';
import GlobalStateManager from './global-state-manager';
declare type BooleanFunction = () => boolean;
export default function _addReducers<G extends {} = State, R extends {} = Reducers, AR extends AdditionalReducers<G, R> = AdditionalReducers<G, R>, ARR extends AdditionalReducers<G, R & AR> = AdditionalReducers<G, R & AR>>(globalStateManager: GlobalStateManager<G, R>, reducers: Partial<R> & ARR): BooleanFunction;
export {};
