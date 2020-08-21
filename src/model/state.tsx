import {
  ILocalizedStrings,
  IBookNameData,
  User,
  IOrbitState,
  IUploadState,
  IMediaState,
  IParatextState,
  IImportExportState,
  IAuthState,
} from '.';

export interface IState {
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
