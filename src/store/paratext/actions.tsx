import Axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import {
  USERNAME_PENDING,
  USERNAME_SUCCESS,
  USERNAME_ERROR,
  COUNT_PENDING,
  COUNT_SUCCESS,
  COUNT_ERROR,
  PROJECTS_PENDING,
  PROJECTS_SUCCESS,
  PROJECTS_ERROR,
  SYNC_PENDING,
  SYNC_SUCCESS,
  SYNC_ERROR,
} from './types';
import { ParatextProject } from '../../model/paratextProject';
import { pendingStatus, errStatus } from '../AxiosStatus';

export const getUserName = (auth: Auth, pendingmsg: string) => (
  dispatch: any
) => {
  dispatch({
    payload: pendingStatus(pendingmsg),
    type: USERNAME_PENDING,
  });
  Axios.get(API_CONFIG.host + '/api/paratext/username', {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      dispatch({ payload: response.data, type: USERNAME_SUCCESS });
    })
    .catch((err: AxiosError) => {
      console.log('username failed.');
      console.log(err);
      dispatch({
        payload: errStatus(err),
        type: USERNAME_ERROR,
      });
    });
};
export const resetProjects = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: PROJECTS_PENDING,
  });
};

export const getProjects = (
  auth: Auth,
  pendingmsg: string,
  languageTag?: string
) => (dispatch: any) => {
  dispatch({
    payload: pendingStatus(pendingmsg),
    type: PROJECTS_PENDING,
  });
  let url = API_CONFIG.host + '/api/paratext/projects';
  if (languageTag) url += '/' + languageTag;
  Axios.get(url, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      let pt: ParatextProject[] = [];
      for (let ix = 0; ix < response.data.length; ix++) {
        let o: ParatextProject = {
          Name: response.data[ix].Name,
          ParatextId: response.data[ix].ParatextId,
          LanguageName: response.data[ix].LanguageName,
          LanguageTag: response.data[ix].LanguageTag,
          CurrentUserRole: response.data[ix].CurrentUserRole,
          ProjectIds: response.data[ix].ProjectIds,
          IsConnected: response.data[ix].IsConnected,
          IsConnectable: response.data[ix].IsConnectable,
        };
        pt.push(o);
      }
      dispatch({ payload: pt, type: PROJECTS_SUCCESS });
    })
    .catch(err => {
      console.log('projects failed.');
      console.log(err);
      dispatch({ payload: errStatus(err), type: PROJECTS_ERROR });
    });
};

export const resetCount = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: COUNT_PENDING,
  });
};

export const getCount = (auth: Auth, projectId: number, pendingmsg: string) => (
  dispatch: any
) => {
  dispatch({
    payload: pendingStatus(pendingmsg),
    type: COUNT_PENDING,
  });
  let path = API_CONFIG.host + '/api/paratext/project/' + projectId + '/count';
  Axios.get(path, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      dispatch({ payload: response.data, type: COUNT_SUCCESS });
    })
    .catch(err => {
      console.log('count failed.');
      console.log(err);
      dispatch({ payload: errStatus(err), type: COUNT_ERROR });
    });
};
export const resetSync = () => (dispatch: any) => {
  dispatch({ payload: undefined, type: SYNC_PENDING });
};
export const syncProject = (
  auth: Auth,
  projectId: number,
  pendingmsg: string
) => (dispatch: any) => {
  dispatch({ payload: pendingStatus(pendingmsg), type: SYNC_PENDING });

  Axios.post(API_CONFIG.host + '/api/paratext/project/' + projectId, null, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      dispatch({ payload: response.data, type: SYNC_SUCCESS });
      getCount(auth, projectId, '');
    })
    .catch(err => {
      console.log('Sync failed.');
      console.log(err);
      dispatch({ payload: errStatus(err), type: SYNC_ERROR });
    });
};
