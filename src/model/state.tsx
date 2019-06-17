import { ILocalizedStrings } from './localizeModel';
import { IBookNameData } from './bookName';
import { User } from './user';

export interface IState {
  strings: ILocalizedStrings;
  books: IBookNameData;
  orbit: { loaded: boolean };
  who: {
    user: User;
    initials: string;
  };
  upload: {
    current: number;
    loaded: boolean;
    files: FileList;
  };
}
