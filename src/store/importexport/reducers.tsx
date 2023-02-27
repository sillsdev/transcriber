import { pendingStatus, successStatus, successStatusMsg } from '../AxiosStatus';
import {
  EXPORT_SUCCESS,
  EXPORT_PENDING,
  EXPORT_ERROR,
  EXPORT_COMPLETE,
  ExportMsgs,
  IMPORT_SUCCESS,
  IMPORT_PENDING,
  IMPORT_ERROR,
  IMPORT_COMPLETE,
  ImportMsgs,
  COPY_SUCCESS,
  COPY_PENDING,
  COPY_ERROR,
  COPY_COMPLETE,
  CopyMsgs,
  IImportExportState,
} from './types';

export const exportCleanState = {
  loaded: false,
  importexportStatus: undefined,
} as IImportExportState;

const ImportExportReducers = function (
  state = exportCleanState,
  action: ExportMsgs | ImportMsgs | CopyMsgs
): IImportExportState {
  switch (action.type) {
    case EXPORT_PENDING:
      return {
        ...state,
        loaded: false,
        importexportStatus: pendingStatus(action.payload),
      };
    case EXPORT_SUCCESS:
      return {
        ...state,
        loaded: true,
        exportFile: action.payload,
        importexportStatus: successStatus(action.payload.message),
      };
    case EXPORT_ERROR:
      return {
        ...state,
        importexportStatus: action.payload,
      };
    case EXPORT_COMPLETE:
      return {
        ...state,
        importexportStatus: action.payload,
      };
    case IMPORT_PENDING:
      return {
        ...state,
        loaded: false,
        importexportStatus: pendingStatus(action.payload),
      };
    case IMPORT_SUCCESS:
      return {
        ...state,
        loaded: true,
        importexportStatus: successStatusMsg(
          action.payload.status,
          action.payload.msg
        ),
      };
    case IMPORT_ERROR:
      return {
        ...state,
        importexportStatus: action.payload,
      };
    case IMPORT_COMPLETE:
      return {
        ...state,
        importexportStatus: action.payload,
      };
    case COPY_PENDING:
      return {
        ...state,
        loaded: false,
        importexportStatus: pendingStatus(action.payload),
      };
    case COPY_SUCCESS:
      return {
        ...state,
        loaded: true,
        importexportStatus: successStatusMsg(
          action.payload.status,
          action.payload.msg
        ),
      };
    case COPY_ERROR:
      return {
        ...state,
        importexportStatus: action.payload,
      };
    case COPY_COMPLETE:
      return {
        ...state,
        importexportStatus: action.payload,
      };
    default:
      return { ...state };
  }
};

export default ImportExportReducers;
