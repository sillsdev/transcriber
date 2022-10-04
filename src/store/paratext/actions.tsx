import Axios from 'axios';
import { API_CONFIG } from '../../api-variable';
import {
  Passage,
  ActivityStates,
  IIntegrationStrings,
  MediaFile,
} from '../../model';
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
  TEXT_PENDING,
  TEXT_ERROR,
  TEXT_SUCCESS,
} from './types';
import { ParatextProject } from '../../model/paratextProject';
import { pendingStatus, errStatus, errorStatus } from '../AxiosStatus';
import { findRecord, getMediaInPlans, related } from '../../crud';
import {
  fileJson,
  getLocalParatextText,
  infoMsg,
  logError,
  Severity,
  refMatch,
  axiosError,
} from '../../utils';
import MemorySource from '@orbit/memory';

export const resetUserName = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: USERNAME_PENDING,
  });
};
export const resetParatextText = () => async (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: TEXT_PENDING,
  });
};
export const getParatextText =
  (
    token: string,
    passageId: number,
    artifactId: string | null,
    errorReporter: any,
    pendingmsg: string
  ) =>
  async (dispatch: any) => {
    dispatch({
      payload: pendingStatus(pendingmsg),
      type: TEXT_PENDING,
    });
    try {
      let url =
        API_CONFIG.host + '/api/paratext/passage/' + passageId.toString();
      if (artifactId) url += `/${artifactId}`;
      let response = await Axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      dispatch({ payload: response.data, type: TEXT_SUCCESS });
    } catch (err: any) {
      if (err.errMsg !== 'no range')
        logError(
          Severity.error,
          errorReporter,
          infoMsg(err, 'Paratext Text failed')
        );
      dispatch({ payload: errStatus(err), type: TEXT_ERROR });
    }
  };
export const getParatextTextLocal =
  (
    ptPath: string,
    passage: Passage,
    ptProjName: string,
    errorReporter: any,
    pendingmsg: string
  ) =>
  async (dispatch: any) => {
    dispatch({
      payload: pendingStatus(pendingmsg),
      type: TEXT_PENDING,
    });
    try {
      var pt = localProjects(ptPath, undefined, ptProjName);
      if (pt && pt.length > 0) {
        let response = await getLocalParatextText(passage, pt[0].ShortName);
        dispatch({ payload: response, type: TEXT_SUCCESS });
      } else
        dispatch({
          payload: errorStatus(undefined, 'No Local Project' + ptProjName),
          type: TEXT_ERROR,
        });
    } catch (err: any) {
      if (err.errMsg !== 'no range')
        logError(
          Severity.error,
          errorReporter,
          infoMsg(err, 'Paratext Text failed')
        );
      dispatch({ payload: errStatus(err), type: TEXT_ERROR });
    }
  };

export const getUserName =
  (token: string, errorReporter: any, pendingmsg: string) =>
  async (dispatch: any) => {
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
              Authorization: 'Bearer ' + token,
            },
          }
        );
        dispatch({ payload: response.data, type: USERNAME_SUCCESS });
        success = true;
      } catch (err: any) {
        lasterr = err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      numTries--;
    }
    if (!success) {
      logError(Severity.info, errorReporter, 'Username failed');
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

export const getProjects =
  (
    token: string,
    pendingmsg: string,
    errorReporter: any,
    languageTag?: string
  ) =>
  (dispatch: any) => {
    dispatch({
      payload: pendingStatus(pendingmsg),
      type: PROJECTS_PENDING,
    });
    let url = API_CONFIG.host + '/api/paratext/projects';
    if (languageTag) url += '/' + languageTag;
    Axios.get(url, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .then((response) => {
        let pt: ParatextProject[] = [];
        var data = response.data;
        for (let ix = 0; ix < data?.length; ix++) {
          let o: ParatextProject = {
            Name: data[ix].name,
            ShortName: data[ix].shortName,
            ParatextId: data[ix].paratextId,
            LanguageName: data[ix].languageName,
            LanguageTag: data[ix].languageTag,
            CurrentUserRole: data[ix].currentUserRole,
            ProjectType: data[ix].projectType,
            BaseProject: data[ix].baseProject,
            IsConnectable: data[ix].isConnectable,
          };
          pt.push(o);
        }
        dispatch({ payload: pt, type: PROJECTS_SUCCESS });
      })
      .catch((err) => {
        logError(
          Severity.error,
          errorReporter,
          infoMsg(err, 'Projects failed')
        );
        dispatch({ payload: errStatus(err), type: PROJECTS_ERROR });
      });
  };

const localProjects = (
  ptPath: string,
  languageTag?: string,
  projName?: string
) => {
  if (ptPath === '') return;
  const fs = require('fs');
  const path = require('path');
  let pt: ParatextProject[] = [];
  fs.readdirSync(ptPath)
    .filter((n: string) => n.indexOf('.') === -1 && n[0] !== '_')
    .forEach((n: string) => {
      const settingsPath = path.join(ptPath, n, 'Settings.xml');
      const settingsJson = fileJson(settingsPath);
      if (settingsJson) {
        const setting = settingsJson.ScriptureText;
        const langIso = setting.LanguageIsoCode._text
          .replace(/::?:?/g, '-')
          .replace(/-$/, '');
        pt.push({
          ParatextId: setting.Guid._text,
          Name: setting.FullName._text,
          ShortName: setting.Name._text,
          LanguageName: setting.Language._text,
          LanguageTag: langIso,
          CurrentUserRole:
            setting.Editable._text === 'T' ? 'pt_translator' : '',
          IsConnectable: setting.Editable._text === 'T',
          ProjectType: setting.TranslationInfo._text.split(':')[0],
          BaseProject: setting.TranslationInfo._text.split(':')[2],
        } as ParatextProject);
      }
    });
  if (projName) {
    pt = pt.filter((p) => p.Name === projName);
  }
  if (languageTag) {
    pt = pt.filter(
      (p) =>
        p.LanguageTag === languageTag ||
        (p.BaseProject !== '' &&
          pt.find((b) => b.ParatextId === p.BaseProject)?.LanguageTag ===
            languageTag)
    );
  }
  return pt;
};

export const getLocalProjects =
  (
    ptPath: string,
    pendingmsg: string,
    projIds: {
      Name: string;
      Id: string;
    }[],
    languageTag?: string
  ) =>
  (dispatch: any) => {
    dispatch({
      payload: pendingStatus(pendingmsg),
      type: PROJECTS_PENDING,
    });
    if (ptPath === '') return;
    let pts = localProjects(ptPath, languageTag);
    dispatch({ payload: pts, type: PROJECTS_SUCCESS });
  };

export const resetCount = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: COUNT_PENDING,
  });
};
//not used
export const getCount =
  (
    token: string,
    kind: string,
    id: number,
    errorReporter: any,
    pendingmsg: string
  ) =>
  (dispatch: any) => {
    dispatch({
      payload: pendingStatus(pendingmsg),
      type: COUNT_PENDING,
    });
    let path = API_CONFIG.host + '/api/paratext/' + kind + '/' + id + '/count';
    Axios.get(path, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .then((response) => {
        dispatch({ payload: response.data, type: COUNT_SUCCESS });
      })
      .catch((err) => {
        logError(Severity.error, errorReporter, infoMsg(err, 'Count failed'));
        dispatch({ payload: errStatus(err), type: COUNT_ERROR });
      });
  };

export const getLocalCount =
  (
    mediafiles: MediaFile[],
    plan: string,
    memory: MemorySource,
    errorReporter: any,
    t: IIntegrationStrings,
    artifactId: string | null,
    passageId: string | undefined
  ) =>
  (dispatch: any) => {
    dispatch({
      payload: pendingStatus(t.countPending),
      type: COUNT_PENDING,
    });
    const media = plan
      ? getMediaInPlans([plan], mediafiles, artifactId, true)
      : [];
    let ready = media.filter(
      (m) =>
        m.attributes?.transcriptionstate === ActivityStates.Approved &&
        Boolean(related(m, 'passage'))
    );
    if (passageId)
      ready = ready.filter((m) => related(m, 'passage') === passageId);

    const refMissing = ready.filter((m) => {
      const passage = findRecord(
        memory,
        'passage',
        related(m, 'passage')
      ) as Passage;
      return (
        !refMatch(passage?.attributes?.reference || 'Err') ||
        !passage?.attributes?.book
      );
    });
    if (refMissing.length > 0) {
      const err = errorStatus(
        101,
        t.invalidReferences.replace('{0}', `${refMissing.length}`)
      );
      logError(Severity.error, errorReporter, axiosError(err));
      dispatch({
        type: COUNT_ERROR,
        payload: err,
      });
    } else dispatch({ payload: ready.length, type: COUNT_SUCCESS });
  };

export const resetSync = () => (dispatch: any) => {
  dispatch({ payload: undefined, type: SYNC_PENDING });
};
export const syncPassage =
  (
    token: string,
    passageId: number,
    typeId: number, //0 for vernacular?
    errorReporter: any,
    pendingmsg: string,
    successmsg: string
  ) =>
  (dispatch: any) => {
    dispatch({ payload: pendingStatus(pendingmsg), type: SYNC_PENDING });

    Axios.post(
      `${API_CONFIG.host}/api/paratext/passage/${passageId}/${typeId}`,
      null,
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      }
    )
      .then((response) => {
        dispatch({ payload: successmsg, type: SYNC_SUCCESS });
      })
      .catch((err) => {
        logError(Severity.error, errorReporter, infoMsg(err, 'Sync Failed'));
        dispatch({ payload: errStatus(err), type: SYNC_ERROR });
      });
  };

export const syncProject =
  (
    token: string,
    projectId: number,
    typeId: number, //0 for vernacular?
    errorReporter: any,
    pendingmsg: string,
    successmsg: string
  ) =>
  (dispatch: any) => {
    dispatch({ payload: pendingStatus(pendingmsg), type: SYNC_PENDING });

    Axios.post(
      `${API_CONFIG.host}/api/paratext/project/${projectId}/${typeId}`,
      null,
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      }
    )
      .then((response) => {
        dispatch({ payload: successmsg, type: SYNC_SUCCESS });
      })
      .catch((err) => {
        logError(Severity.error, errorReporter, infoMsg(err, 'Sync Failed'));
        dispatch({ payload: errStatus(err), type: SYNC_ERROR });
      });
  };
