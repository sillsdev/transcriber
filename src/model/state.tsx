import { ILocalizedStrings } from './localizeModel';
import { User } from './user';

export interface IState {
    strings: ILocalizedStrings;
    orbit: { loaded: boolean; };
    who: {
        user: User;
        initials: string;
    };
    upload: {
        current: number;
        loaded: boolean;
        files: FileList;
    }
};