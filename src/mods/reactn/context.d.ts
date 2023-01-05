import { Context } from 'react';
import GlobalStateManager from './global-state-manager';
declare type AnyGSM = GlobalStateManager<any, any>;
interface TrueContext<T> extends Context<T> {
    _currentValue: T;
    _currentValue2: T;
}
declare const _default: TrueContext<AnyGSM>;
export default _default;
