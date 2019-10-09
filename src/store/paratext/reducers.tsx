import * as type from './types';
import { successStatus, pendingStatus } from '../AxiosStatus';

export const paratextCleanState = {
  count: 0,
  countStatus: pendingStatus(''),
  username: '',
  usernameStatus: pendingStatus(''),
  projects: [] as any,
  projectsStatus: pendingStatus(''),
} as type.IParatextState;

export default function(
  state = paratextCleanState,
  action: type.ParatextMsgs
): type.IParatextState {
  switch (action.type) {
    case type.USERNAME_PENDING:
      return {
        ...state,
        username: '',
        usernameStatus: action.payload,
      };
    case type.USERNAME_SUCCESS:
      return {
        ...state,
        username: action.payload,
        usernameStatus: successStatus(action.payload),
      };
    case type.USERNAME_ERROR:
      return {
        ...state,
        usernameStatus: action.payload,
      };
    case type.COUNT_PENDING:
      return {
        ...state,
        count: 0,
        countStatus: action.payload,
      };
    case type.COUNT_SUCCESS:
      return {
        ...state,
        count: action.payload,
        countStatus: successStatus(''),
      };
    case type.COUNT_ERROR:
      return {
        ...state,
        countStatus: action.payload,
      };
    case type.PROJECTS_PENDING:
      return {
        ...state,
        projects: [],
        projectsStatus: action.payload,
      };
    case type.PROJECTS_SUCCESS:
      return {
        ...state,
        projects: action.payload,
        projectsStatus: successStatus('Select Paratext Project'),
      };
    case type.PROJECTS_ERROR:
      return {
        ...state,
        projectsStatus: action.payload,
      };
    case type.SYNC_PENDING:
      return {
        ...state,
        syncStatus: action.payload,
      };
    case type.SYNC_SUCCESS:
      return {
        ...state,
        syncStatus: successStatus('Sync Complete'),
      };
    case type.SYNC_ERROR:
      return {
        ...state,
        syncStatus: action.payload,
      };
    default:
      return { ...state };
  }
}
