import { ILocalizedStrings } from './localizeModel';
import { User } from './user';

export interface IUploadFile {
    name: string;
    size: number;
    type: string;
    lastModified: number;
};

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
        files: Array<IUploadFile>;
    }
};