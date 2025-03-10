import * as type from './types';
import { successStatus } from '../AxiosStatus';

export const paratextCleanState = {
  count: 0,
  countStatus: undefined,
  username: '',
  usernameStatus: undefined,
  projects: [] as any,
  projectsStatus: undefined,
  syncStatus: undefined,
  textStatus: undefined,
} as type.IParatextState;

const ParatextReducers = function (
  state = paratextCleanState,
  action: type.ParatextMsgs
): type.IParatextState {
  switch (action?.type) {
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
      return action.payload
        ? {
            ...state,
            count: -1, //pending
            countStatus: action.payload,
          }
        : { ...state, countStatus: undefined }; //reset status;
    case type.COUNT_SUCCESS:
      return {
        ...state,
        count: action.payload,
        countStatus: successStatus(''),
      };
    case type.COUNT_ERROR:
      return {
        ...state,
        count: 0,
        countStatus: action.payload,
      };
    case type.PROJECTS_PENDING:
      return {
        ...state,
        projects: [],
        projectsStatus: action.payload,
        syncStatus: undefined,
      };
    case type.PROJECTS_SUCCESS:
      return {
        ...state,
        projects: action.payload,
        projectsStatus: successStatus(''),
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
        syncStatus: successStatus(action.payload),
      };
    case type.SYNC_ERROR:
      return {
        ...state,
        syncStatus: action.payload,
      };
    case type.TEXT_PENDING:
      return {
        ...state,
        textStatus: action.payload,
      };
    case type.TEXT_SUCCESS:
      return {
        ...state,
        textStatus: successStatus(action.payload),
      };
    case type.TEXT_ERROR:
      return {
        ...state,
        textStatus: action.payload,
      };
    case type.CANPUBLISH_PENDING:
      return action.payload
        ? {
            ...state,
            canPublish: undefined, //pending
            canPublishStatus: action.payload,
          }
        : { ...state, canPublishStatus: undefined }; //reset status;
    case type.CANPUBLISH_SUCCESS:
      return {
        ...state,
        canPublish: Boolean(action.payload),
        canPublishStatus: successStatus(''),
      };
    case type.CANPUBLISH_ERROR:
      return {
        ...state,
        canPublish: undefined,
        canPublishStatus: action.payload,
      };

    default:
      return { ...state };
  }
};

export default ParatextReducers;
