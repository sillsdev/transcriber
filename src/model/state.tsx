import {
  ILocalizedStrings,
  IBookNameData,
  User,
  IOrbitState,
  IUploadState,
  IParatextState,
  IImportExportState,
  IAuthState,
  IConvertBlobState,
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
  paratext: IParatextState;
  importexport: IImportExportState;
  auth: IAuthState;
  convertBlob: IConvertBlobState;
}
