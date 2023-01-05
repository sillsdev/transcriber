import { Reducers, State } from '../default';
import NewGlobalState from '../types/new-global-state';
import WithInit from '../types/with-init';
export default function _withInit<G extends {} = State, R extends {} = Reducers, P extends {} = {}>(initialGlobal?: NewGlobalState<G> | null, initialReducers?: null | R): WithInit<P, G, R>;
