import Axios from 'axios';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import { Passage, ActivityStates } from '../../model';
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
import { pendingStatus, errStatus, errorStatus } from '../AxiosStatus';
import { getMediaProjRec, getMediaRec } from '../../crud';
import { fileJson, infoMsg, logError, Severity } from '../../utils';
import MemorySource from '@orbit/memory';

export const resetUserName = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: USERNAME_PENDING,
  });
};

export const getUserName = (
  auth: Auth,
  errorReporter: any,
  pendingmsg: string
) => async (dispatch: any) => {
  dispatch({
    payload: pendingStatus(pendingmsg),
    type: USERNAME_PENDING,
  });
  let numTries = 5;
  let success = false;
  let lasterr: any = null;
  while (numTries > 0 && !success) {
    try {
      let response = await Axios.get(
        API_CONFIG.host + '/api/paratext/username',
        {
          headers: {
            Authorization: 'Bearer ' + auth.accessToken,
          },
        }
      );
      dispatch({ payload: response.data, type: USERNAME_SUCCESS });
      success = true;
    } catch (err) {
      lasterr = err;
      logError(Severity.info, errorReporter, infoMsg(err, 'Username failed'));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log('username', numTries);
    numTries--;
  }
  if (!success) {
    dispatch({
      payload:
        lasterr !== null
          ? errStatus(lasterr)
          : errorStatus(-1, 'unknown username error'),
      type: USERNAME_ERROR,
    });
  }
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
  errorReporter: any,
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
    .then((response) => {
      let pt: ParatextProject[] = [];
      for (let ix = 0; ix < response.data.length; ix++) {
        let o: ParatextProject = {
          Name: response.data[ix].Name,
          ShortName: 'unused',
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
    .catch((err) => {
      logError(Severity.info, errorReporter, infoMsg(err, 'Projects failed'));
      dispatch({ payload: errStatus(err), type: PROJECTS_ERROR });
    });
};

export const getLocalProjects = (
  ptPath: string,
  pendingmsg: string,
  languageTag?: string
) => (dispatch: any) => {
  dispatch({
    payload: pendingStatus(pendingmsg),
    type: PROJECTS_PENDING,
  });
  if (ptPath === '') return;
  const fs = require('fs');
  const path = require('path');
  let pt: ParatextProject[] = [];
  fs.readdirSync(ptPath)
    .filter((n: string) => n.indexOf('.') === -1 && n[0] !== '_')
    .forEach((n: string) => {
      const settingsPath = path.join(ptPath, n, 'settings.xml');
      const settingsJson = fileJson(settingsPath);
      if (settingsJson) {
        const setting = settingsJson.ScriptureText;
        const langIso = setting.LanguageIsoCode._text.split(':')[0];
        if (!languageTag || langIso === languageTag) {
          pt.push({
            Name: setting.FullName._text,
            ShortName: setting.Name._text,
            LanguageName: setting.Language._text,
            LanguageTag: langIso,
            CurrentUserRole:
              setting.Editable._text === 'T' ? 'pt_translator' : '',
            ProjectIds: Array<number>(),
            IsConnected: true,
            IsConnectable: true,
          } as ParatextProject);
        }
      }
    });
  dispatch({ payload: pt, type: PROJECTS_SUCCESS });
};

export const resetCount = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: COUNT_PENDING,
  });
};

export const getCount = (
  auth: Auth,
  projectId: number,
  errorReporter: any,
  pendingmsg: string
) => (dispatch: any) => {
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
    .then((response) => {
      dispatch({ payload: response.data, type: COUNT_SUCCESS });
    })
    .catch((err) => {
      logError(Severity.info, errorReporter, infoMsg(err, 'Count failed'));
      dispatch({ payload: errStatus(err), type: COUNT_ERROR });
    });
};

export const getLocalCount = (
  passages: Passage[],
  project: string,
  memory: MemorySource,
  pendingmsg: string
) => (dispatch: any) => {
  dispatch({
    payload: pendingStatus(pendingmsg),
    type: COUNT_PENDING,
  });
  const ready = passages
    .filter((p) => p.attributes.state === ActivityStates.Approved)
    .filter((p) => {
      const projRec = getMediaProjRec(getMediaRec(p.id, memory), memory);
      return projRec && projRec.id === project;
    });
  dispatch({ payload: ready.length, type: COUNT_SUCCESS });
};

export const resetSync = () => (dispatch: any) => {
  dispatch({ payload: undefined, type: SYNC_PENDING });
};
export const syncProject = (
  auth: Auth,
  projectId: number,
  errorReporter: any,
  pendingmsg: string
) => (dispatch: any) => {
  dispatch({ payload: pendingStatus(pendingmsg), type: SYNC_PENDING });

  Axios.post(API_CONFIG.host + '/api/paratext/project/' + projectId, null, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then((response) => {
      dispatch({ payload: response.data, type: SYNC_SUCCESS });
      getCount(auth, projectId, errorReporter, '');
    })
    .catch((err) => {
      logError(Severity.info, errorReporter, infoMsg(err, 'Sync Failed'));
      dispatch({ payload: errStatus(err), type: SYNC_ERROR });
    });
};
