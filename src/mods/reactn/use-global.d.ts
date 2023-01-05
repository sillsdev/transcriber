import { State } from '../default';
import { GlobalTuple, StateTuple } from '../types/use-global';
import GlobalStateManager from './global-state-manager';
export default function _useGlobal<G extends {} = State>(overrideGlobalStateManager: GlobalStateManager<G> | null): GlobalTuple<G>;
export default function _useGlobal<G extends {} = State, Property extends keyof G = keyof G>(overrideGlobalStateManager: GlobalStateManager<G> | null, property: Property): StateTuple<G, Property>;
