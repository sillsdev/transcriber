import { IAxiosStatus } from '../AxiosStatus';

export interface FileResponse {
  data: {
    attributes: {
      message: string;
      fileurl: string;
      contenttype: string;
    };
    type: string; //"file-responses",
    id: string;
  };
}
// Describing the shape of the paratext integration slice of state
export interface IImportExportState {
  loaded: boolean;
  exportFile: FileResponse;
  importexportStatus: IAxiosStatus;
}

// Describing the different ACTION NAMES available
export const EXPORT_PENDING = 'EXPORT_PENDING';
export const EXPORT_SUCCESS = 'EXPORT_SUCCESS';
export const EXPORT_ERROR = 'EXPORT_ERROR';
export const EXPORT_COMPLETE = 'EXPORT_COMPLETE';
export const IMPORT_PENDING = 'IMPORT_PENDING';
export const IMPORT_SUCCESS = 'IMPORT_SUCCESS';
export const IMPORT_ERROR = 'IMPORT_ERROR';
export const IMPORT_COMPLETE = 'IMPORT_COMPLETE';

interface ExportPendingMsg {
  type: typeof EXPORT_PENDING;
  payload: string;
}

interface ExportSucceededMsg {
  type: typeof EXPORT_SUCCESS;
  payload: FileResponse;
}

interface ExportFailedMsg {
  type: typeof EXPORT_ERROR;
  payload: IAxiosStatus;
}
interface ExportCompleteMsg {
  type: typeof EXPORT_COMPLETE;
  payload: IAxiosStatus;
}

export type ExportMsgs =
  | ExportPendingMsg
  | ExportSucceededMsg
  | ExportFailedMsg
  | ExportCompleteMsg;

interface ImportPendingMsg {
  type: typeof IMPORT_PENDING;
  payload: string;
}

interface ImportSucceededMsg {
  type: typeof IMPORT_SUCCESS;
  payload: string;
}

interface ImportFailedMsg {
  type: typeof IMPORT_ERROR;
  payload: IAxiosStatus;
}
interface ImportCompleteMsg {
  type: typeof IMPORT_COMPLETE;
  payload: string;
}

export type ImportMsgs =
  | ImportPendingMsg
  | ImportSucceededMsg
  | ImportFailedMsg
  | ImportCompleteMsg;
