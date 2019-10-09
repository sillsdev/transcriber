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

export const getUserName = (auth: Auth) => (dispatch: any) => {
  dispatch({
    payload: pendingStatus('Querying username...'),
    type: USERNAME_PENDING,
  });
  Axios.get(API_CONFIG.host + '/api/paratext/username', {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      console.log(response);
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
export const getProjects = (auth: Auth) => (dispatch: any) => {
  dispatch({
    payload: pendingStatus('Querying projects...'),
    type: PROJECTS_PENDING,
  });
  Axios.get(API_CONFIG.host + '/api/paratext/projects', {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      console.log(response.data);
      var pt: ParatextProject[] = [];
      for (var ix = 0; ix < response.data.length; ix++) {
        var o: ParatextProject = {
          Name: response.data[ix].Name,
          ParatextId: response.data[ix].ParatextId,
          LanguageName: response.data[ix].LanguageName,
          LanguageTag: response.data[ix].LanguageTag,
          CurrentUserRole: response.data[ix].CurrentUserRole,
          ProjectId: response.data[ix].ProjectId,
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
export const getCount = (auth: Auth, projectId: number) => (dispatch: any) => {
  dispatch({
    payload: pendingStatus('Querying count...'),
    type: COUNT_PENDING,
  });
  var path = API_CONFIG.host + '/api/paratext/project/' + projectId + '/count';
  Axios.get(path, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      console.log(response);
      dispatch({ payload: response.data, type: COUNT_SUCCESS });
    })
    .catch(err => {
      console.log('count failed.');
      console.log(err);
      dispatch({ payload: errStatus(err), type: COUNT_ERROR });
    });
};
export const syncProject = (auth: Auth, projectId: number) => (
  dispatch: any
) => {
  dispatch({ payload: pendingStatus('Syncing...'), type: SYNC_PENDING });

  Axios.post(API_CONFIG.host + '/api/paratext/project/' + projectId, null, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then(response => {
      console.log(response);
      dispatch({ payload: response.data, type: SYNC_SUCCESS });
      getCount(auth, projectId);
    })
    .catch(err => {
      console.log('Sync failed.');
      console.log(err);
      dispatch({ payload: errStatus(err), type: SYNC_ERROR });
    });
};
