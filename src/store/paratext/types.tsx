import { ParatextProject } from '../../model/paratextProject';
import { IAxiosStatus } from '../AxiosStatus';

// Describing the shape of the paratext integration slice of state
export interface IParatextState {
  count: number;
  countStatus?: IAxiosStatus;
  username: string;
  shortName: string;
  usernameStatus?: IAxiosStatus;
  projects: ParatextProject[];
  projectsStatus?: IAxiosStatus;
  syncStatus?: IAxiosStatus;
  textStatus?: IAxiosStatus;
}

// Describing the different ACTION NAMES available
export const USERNAME_PENDING = 'USERNAME_PENDING';
export const USERNAME_SUCCESS = 'USERNAME_SUCCESS';
export const USERNAME_ERROR = 'USERNAME_ERROR';
export const COUNT_PENDING = 'COUNT_PENDING';
export const COUNT_SUCCESS = 'COUNT_SUCCESS';
export const COUNT_ERROR = 'COUNT_ERROR';
export const PROJECTS_PENDING = 'PROJECTS_PENDING';
export const PROJECTS_SUCCESS = 'PROJECTS_SUCCESS';
export const PROJECTS_ERROR = 'PROJECTS_ERROR';
export const UPDPROJECTS_PENDING = 'UPDPROJECTS_PENDING';
export const UPDPROJECTS_SUCCESS = 'UPDPROJECTS_SUCCESS';
export const UPDPROJECTS_ERROR = 'UPDPROJECTS_ERROR';
export const SYNC_PENDING = 'SYNC_PENDING';
export const SYNC_SUCCESS = 'SYNC_SUCCESS';
export const SYNC_ERROR = 'SYNC_ERROR';
export const TEXT_PENDING = 'TEXT_PENDING';
export const TEXT_SUCCESS = 'TEXT_SUCCESS';
export const TEXT_ERROR = 'TEXT_ERROR';

interface UserNamePendingMsg {
  type: typeof USERNAME_PENDING;
  payload: IAxiosStatus;
}

interface UserNameSucceededMsg {
  type: typeof USERNAME_SUCCESS;
  payload: string;
}

interface UserNameFailedMsg {
  type: typeof USERNAME_ERROR;
  payload: IAxiosStatus;
}

interface ProjectsPendingMsg {
  type: typeof PROJECTS_PENDING;
  payload: IAxiosStatus;
}

interface ProjectsSucceededMsg {
  type: typeof PROJECTS_SUCCESS;
  payload: ParatextProject[];
}

interface ProjectsFailedMsg {
  type: typeof PROJECTS_ERROR;
  payload: IAxiosStatus;
}
interface UpdProjectsPendingMsg {
  type: typeof UPDPROJECTS_PENDING;
  payload: IAxiosStatus;
}

interface UpdProjectsSucceededMsg {
  type: typeof UPDPROJECTS_SUCCESS;
  payload: string;
}

interface UpdProjectsFailedMsg {
  type: typeof UPDPROJECTS_ERROR;
  payload: IAxiosStatus;
}
interface CountPendingMsg {
  type: typeof COUNT_PENDING;
  payload: IAxiosStatus;
}

interface CountSucceededMsg {
  type: typeof COUNT_SUCCESS;
  payload: number;
}

interface CountFailedMsg {
  type: typeof COUNT_ERROR;
  payload: IAxiosStatus;
}
interface SyncPendingMsg {
  type: typeof SYNC_PENDING;
  payload: IAxiosStatus;
}

interface SyncSucceededMsg {
  type: typeof SYNC_SUCCESS;
  payload: string;
}

interface SyncFailedMsg {
  type: typeof SYNC_ERROR;
  payload: IAxiosStatus;
}

interface ParatextTextPendingMsg {
  type: typeof TEXT_PENDING;
  payload: IAxiosStatus;
}

interface ParatextTextSucceededMsg {
  type: typeof TEXT_SUCCESS;
  payload: string;
}

interface ParatextTextFailedMsg {
  type: typeof TEXT_ERROR;
  payload: IAxiosStatus;
}
export type ParatextMsgs =
  | UserNamePendingMsg
  | UserNameSucceededMsg
  | UserNameFailedMsg
  | ProjectsPendingMsg
  | ProjectsSucceededMsg
  | ProjectsFailedMsg
  | UpdProjectsPendingMsg
  | UpdProjectsSucceededMsg
  | UpdProjectsFailedMsg
  | CountPendingMsg
  | CountSucceededMsg
  | CountFailedMsg
  | SyncPendingMsg
  | SyncSucceededMsg
  | SyncFailedMsg
  | ParatextTextPendingMsg
  | ParatextTextSucceededMsg
  | ParatextTextFailedMsg;
