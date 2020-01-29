import { pendingStatus, successStatus } from '../AxiosStatus';
import {
  EXPORT_SUCCESS,
  EXPORT_PENDING,
  EXPORT_ERROR,
  IImportExportState,
  ExportMsgs,
  EXPORT_COMPLETE,
} from './types';

export const exportCleanState = {
  loaded: false,
  importexportStatus: pendingStatus(''),
} as IImportExportState;

export default function(
  state = exportCleanState,
  action: ExportMsgs
): IImportExportState {
  switch (action.type) {
    case EXPORT_PENDING:
      return {
        ...state,
        loaded: false,
        importexportStatus: action.payload,
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
    default:
      return { ...state };
  }
}
