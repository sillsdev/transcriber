import {
  ILocalizedStrings,
  IBookNameData,
  User,
  IOrbitState,
  IUploadState,
  IContextState,
  IMediaState,
  IParatextState,
  IImportExportState,
  IAuthState,
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
  media: IMediaState;
  paratext: IParatextState;
  importexport: IImportExportState;
  auth: IAuthState;
}
