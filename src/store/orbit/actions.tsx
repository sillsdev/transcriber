import {
  FETCH_ORBIT_DATA,
  ORBIT_ERROR,
  ORBIT_RETRY,
  IApiError,
  RESET_ORBIT_ERROR,
  ORBIT_SAVING,
  FETCH_ORBIT_DATA_COMPLETE,
} from './types';
import Coordinator from '@orbit/coordinator';
import { Sources } from '../../Sources';
import { Severity } from '../../utils';
import { OfflineProject, Plan, VProject } from '../../model';
import { ITokenContext } from '../../context/TokenProvider';
import { AlertSeverity } from '../../hoc/SnackBar';

export const orbitError = (ex: IApiError) => {
  return ex.response.status !== Severity.retry
    ? {
        type: ORBIT_ERROR,
        payload: ex,
      }
    : {
        type: ORBIT_RETRY,
        payload: ex,
      };
};

export const orbitComplete = () => (dispatch: any) => {
  dispatch({
    type: FETCH_ORBIT_DATA_COMPLETE,
  });
};

export const doOrbitError = (ex: IApiError) => (dispatch: any) => {
  dispatch(orbitError(ex));
};

export const resetOrbitError = () => {
  return {
    type: RESET_ORBIT_ERROR,
  };
};

export const orbitSaving = (val: boolean) => {
  return {
    type: ORBIT_SAVING,
    payload: val,
  };
};

export interface IFetchOrbitData {
  coordinator: Coordinator;
  tokenCtx: ITokenContext;
  fingerprint: string;
  errorReporter: any;
  orbitRetries: number;
  setUser: (id: string) => void;
  setProjectsLoaded: (value: string[]) => void;
  setOrbitRetries: (r: number) => void;
  setLang: (locale: string) => void;
  getOfflineProject: (plan: Plan | VProject | string) => OfflineProject;
  offlineSetup: () => Promise<void>;
  showMessage: (msg: string | JSX.Element, alert?: AlertSeverity) => void;
}

export const fetchOrbitData =
  ({
    coordinator,
    tokenCtx,
    fingerprint,
    errorReporter,
    orbitRetries,
    setUser,
    setProjectsLoaded,
    setOrbitRetries,
    setLang,
    getOfflineProject,
    offlineSetup,
    showMessage,
  }: IFetchOrbitData) =>
  (dispatch: any) => {
    Sources(
      coordinator,
      tokenCtx,
      fingerprint,
      errorReporter,
      orbitRetries,
      setUser,
      setProjectsLoaded,
      (ex: IApiError) => dispatch(orbitError(ex)),
      setOrbitRetries,
      setLang,
      getOfflineProject,
      offlineSetup,
      showMessage
    ).then((fr) => {
      dispatch({ type: FETCH_ORBIT_DATA, payload: fr });
    });
  };
