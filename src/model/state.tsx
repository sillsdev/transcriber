import { ILocalizedStrings } from './localizeModel';

export interface IState {
    strings: ILocalizedStrings;
    orbit: {
        loaded: boolean;
    };
}