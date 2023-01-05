import { Reducers, State } from '../../default';
import Reducer, { PropertyReducer } from '../../types/reducer';
export default function isPropertyReducer<G extends {} = State, R extends {} = Reducers, P extends keyof G = keyof G, A extends any[] = any[]>(_reducer: Reducer<G, R, A> | PropertyReducer<G, P, A>, property?: keyof G): _reducer is PropertyReducer<G, P, A>;
