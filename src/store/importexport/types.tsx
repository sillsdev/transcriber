import { IAxiosStatus } from '../AxiosStatus';

export enum ExportType {
  PTF = 'ptf', //one full project
  ITF = 'itf', //one project incremental changes
  ITFBACKUP = 'itfb', //one project incremental backup
  FULLBACKUP = 'zip', //all offline projects - zip of ptfs
  ITFSYNC = 'itfs', //all projects incremental changes to send online
  DBL = 'dbl', //Digital Bible Library Package
  BURRITO = 'burrito', //Scripture Burrito package
  AUDIO = 'audio', //Latest audio export
  ELAN = 'elan', //Latest audio and eaf
}
export interface FileResponse {
  fileURL: string;
  message: string;
  contentType: string;
  buffer: Buffer | undefined;
  changes: number;
  filtered: number;
  id: string;
}
// Describing the shape of the paratext integration slice of state
export interface IImportExportState {
  loaded: boolean;
  exportFile: FileResponse;
  importexportStatus: IAxiosStatus | undefined;
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
export const COPY_PENDING = 'IMPORT_PENDING';
export const COPY_SUCCESS = 'IMPORT_SUCCESS';
export const COPY_ERROR = 'IMPORT_ERROR';
export const COPY_COMPLETE = 'IMPORT_COMPLETE';

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
  payload: { status: string; msg: string };
}

interface ImportFailedMsg {
  type: typeof IMPORT_ERROR;
  payload: IAxiosStatus;
}
interface ImportCompleteMsg {
  type: typeof IMPORT_COMPLETE;
  payload: IAxiosStatus;
}

export type ImportMsgs =
  | ImportPendingMsg
  | ImportSucceededMsg
  | ImportFailedMsg
  | ImportCompleteMsg;

interface CopyPendingMsg {
  type: typeof COPY_PENDING;
  payload: string;
}

interface CopySucceededMsg {
  type: typeof COPY_SUCCESS;
  payload: { status: string; msg: string };
}

interface CopyFailedMsg {
  type: typeof COPY_ERROR;
  payload: IAxiosStatus;
}
interface CopyCompleteMsg {
  type: typeof COPY_COMPLETE;
  payload: IAxiosStatus;
}

export type CopyMsgs =
  | CopyPendingMsg
  | CopySucceededMsg
  | CopyFailedMsg
  | CopyCompleteMsg;
