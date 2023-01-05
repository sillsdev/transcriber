import { State } from '../default';
import Callback from '../types/callback';
import GlobalStateManager from './global-state-manager';
declare type BooleanFunction = () => boolean;
export default function _addCallback<G extends {} = State>(globalStateManager: GlobalStateManager<G>, callback: Callback<G>): BooleanFunction;
export {};
