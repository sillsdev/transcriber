import { Reducers, State } from '../default';
import ReactNProvider from '../types/provider';
export default function _createProvider<G extends {} = State, R extends {} = Reducers>(initialState?: G, initialReducers?: R): ReactNProvider<G, R>;
