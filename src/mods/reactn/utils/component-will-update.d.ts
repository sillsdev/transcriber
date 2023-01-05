import { Reducers, State } from '../../default';
import { ReactNComponent, ReactNPureComponent } from '../../types/component';
export declare const componentWillUpdatePrototype: <P extends {} = {}, S extends {} = {}, G extends {} = State, R extends {} = Reducers, SS = any>(that: ReactNComponent<P, S, G, R, SS> | ReactNPureComponent<P, S, G, R, SS>) => boolean;
