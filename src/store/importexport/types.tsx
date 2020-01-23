import { IAxiosStatus } from '../AxiosStatus';

// Describing the shape of the paratext integration slice of state
export interface IImportExportState {
  loaded: boolean;
  exportFile: File;
  importexportStatus: IAxiosStatus;
}

// Describing the different ACTION NAMES available
export const EXPORT_PENDING = 'EXPORT_PENDING';
export const EXPORT_SUCCESS = 'EXPORT_SUCCESS';
export const EXPORT_ERROR = 'EXPORT_ERROR';
export const EXPORT_COMPLETE = 'EXPORT_COMPLETE';

interface ExportPendingMsg {
  type: typeof EXPORT_PENDING;
  payload: IAxiosStatus;
}

interface ExportSucceededMsg {
  type: typeof EXPORT_SUCCESS;
  payload: File;
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
