import {
  ILocalizedStrings,
  IBookNameData,
  User,
  IOrbitState,
  IUploadState,
  IContextState,
} from '.';

export interface IState {
  context: IContextState;
  strings: ILocalizedStrings;
  books: IBookNameData;
  orbit: IOrbitState;
  who: {
    user: User;
    initials: string;
  };
  upload: IUploadState;
}
