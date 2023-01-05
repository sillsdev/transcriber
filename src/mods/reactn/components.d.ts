import * as React from 'react';
import { Reducers, State } from '../default';
import Callback from '../types/callback';
import { DispatcherMap } from '../types/dispatchers';
import NewGlobalState from '../types/new-global-state';
declare const ReactPureComponent: typeof React.Component;
export declare class ReactNComponent<P extends {} = {}, S extends {} = {}, G extends {} = State, R extends {} = Reducers, SS = any> extends React.Component<P, S, SS> {
    constructor(props: Readonly<P>, context?: any);
    get dispatch(): Readonly<DispatcherMap<G, R>>;
    get global(): Readonly<G>;
    setGlobal(newGlobalState: NewGlobalState<G>, callback?: Callback<G> | null): Promise<Readonly<G>>;
    _globalCallback(): void;
}
export declare class ReactNPureComponent<P extends {} = {}, S extends {} = {}, G extends {} = State, R extends {} = Reducers, SS = any> extends ReactPureComponent<P, S, SS> {
    constructor(props: Readonly<P>, context?: any);
    get dispatch(): Readonly<DispatcherMap<G, R>>;
    get global(): Readonly<G>;
    setGlobal(newGlobalState: NewGlobalState<G>, callback?: Callback<G> | null): Promise<Readonly<G>>;
    _globalCallback(): void;
}
export {};
