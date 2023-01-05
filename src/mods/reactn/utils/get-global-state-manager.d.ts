import { Reducers, State } from '../../default';
import GlobalStateManager from '../global-state-manager';
export default function getGlobalStateManager<G extends {} = State, R extends {} = Reducers>(): GlobalStateManager<G, R>;
