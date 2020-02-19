import { pendingStatus, successStatus } from '../AxiosStatus';
import {
  EXPORT_SUCCESS,
  EXPORT_PENDING,
  EXPORT_ERROR,
  EXPORT_COMPLETE,
  ExportMsgs,
  IMPORT_SUCCESS,
  IMPORT_PENDING,
  IMPORT_ERROR,
  ImportMsgs,
  IImportExportState,
} from './types';

export const exportCleanState = {
  loaded: false,
  importexportStatus: pendingStatus(''),
} as IImportExportState;

export default function(
  state = exportCleanState,
  action: ExportMsgs | ImportMsgs
): IImportExportState {
  switch (action.type) {
    case EXPORT_PENDING:
      return {
        ...state,
        loaded: false,
        importexportStatus: pendingStatus(action.payload),
      };
    case EXPORT_SUCCESS:
      console.log('Export success');
      return {
        ...state,
        loaded: true,
        exportFile: action.payload,
        importexportStatus: successStatus(
          action.payload.data.attributes.message
        ),
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
        importexportStatus: successStatus(action.payload),
      };
    case IMPORT_ERROR:
      return {
        ...state,
        importexportStatus: action.payload,
      };
    default:
      return { ...state };
  }
}
