import { Reducers, State } from '../default';
import WithGlobal, { Getter, Setter } from '../types/with-global';
import GlobalStateManager from './global-state-manager';
export default function _withGlobal<G extends {} = State, R extends {} = Reducers, HP extends {} = {}, LP extends {} = {}>(globalStateManager?: GlobalStateManager<G, R> | null, getter?: Getter<G, R, HP, LP>, setter?: Setter<G, R, HP, LP>): WithGlobal<HP, LP>;
