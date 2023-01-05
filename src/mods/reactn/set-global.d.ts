import { Reducers, State } from '../default';
import Callback from '../types/callback';
import NewGlobalState from '../types/new-global-state';
import GlobalStateManager from './global-state-manager';
export default function _setGlobal<G extends {} = State, R extends {} = Reducers>(globalStateManager: GlobalStateManager<G, R>, newGlobalState: NewGlobalState<G>, callback?: Callback<G, R>): Promise<G>;
