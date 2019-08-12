import {
  ILocalizedStrings,
  IBookNameData,
  User,
  IOrbitState,
  IUploadState,
  IContextState,
  ILangTagData,
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
  langTag: ILangTagData;
}
