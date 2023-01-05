import { ComponentClass } from 'react';
import { Reducers, State } from '../default';
import { ReactNComponentClass } from '../types/component-class';
export default function ReactN<G extends {} = State, R extends {} = Reducers, P extends {} = {}, S extends {} = {}, SS = any>(DecoratedComponent: ComponentClass<P, S>): ReactNComponentClass<P, S, G, R, SS>;
