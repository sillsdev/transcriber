import Axios, { AxiosError } from 'axios';
import path from 'path';
import { IApiError } from '../../model';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import { JSONAPISerializerSettings, ResourceDocument } from '@orbit/jsonapi';
import { JSONAPISerializerCustom } from '../../serializers/JSONAPISerializerCustom';
import {
  EXPORT_PENDING,
  EXPORT_SUCCESS,
  EXPORT_ERROR,
  EXPORT_COMPLETE,
  IMPORT_PENDING,
  IMPORT_SUCCESS,
  IMPORT_ERROR,
  IMPORT_COMPLETE,
} from './types';
import { errStatus, errorStatus } from '../AxiosStatus';
import fs from 'fs';
import Memory from '@orbit/memory';

import { TransformBuilder, Operation } from '@orbit/data';
import { isArray } from 'util';
import IndexedDBSource from '@orbit/indexeddb';
import { electronExport } from './electronExport';
import { insertData } from '../../utils/loadData';
import { logError, Severity } from '../../components/logErrorService';
import { infoMsg, orbitInfo } from '../../utils';
import { isElectron } from '../../api-variable';

export const exportComplete = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: EXPORT_COMPLETE,
  });
};

export const exportProject = (
  exportType: string,
  memory: Memory,
  projectid: number,
  userid: number,
  auth: Auth,
  errorReporter: any,
  pendingmsg: string
) => (dispatch: any) => {
  dispatch({
    payload: pendingmsg,
    type: EXPORT_PENDING,
  });
  if (isElectron) {
    const s: JSONAPISerializerSettings = {
      schema: memory.schema,
      keyMap: memory.keyMap,
    };
    const ser = new JSONAPISerializerCustom(s);
    ser.resourceKey = () => {
      return 'remoteId';
    };
    electronExport(exportType, memory, projectid, userid, ser)
      .then((response) => {
        dispatch({
          payload: response,
          type: EXPORT_SUCCESS,
        });
      })
      .catch((err: Error) => {
        logError(Severity.info, errorReporter, infoMsg(err, 'Export failed: '));
        dispatch({
          payload: errorStatus(-1, err.message),
          type: EXPORT_ERROR,
        });
      });
  } else {
    /* ignore export type for now -- online is always ptf */
    Axios.get(API_CONFIG.host + '/api/offlineData/project/' + projectid, {
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
      timeout: 0, //wait forever
    })
      .then((response) => {
        // console.log(response);
        dispatch({
          payload: response.data,
          type: EXPORT_SUCCESS,
        });
      })
      .catch((err: AxiosError) => {
        logError(Severity.info, errorReporter, infoMsg(err, 'Export failed: '));
        dispatch({
          payload: errStatus(err),
          type: EXPORT_ERROR,
        });
      });
  }
};
export const importComplete = (
  memory: Memory,
  backup: IndexedDBSource,
  errorReporter: any
) => (dispatch: any) => {
  if (isElectron) {
    backup
      .pull((q) => q.findRecords())
      .then((transform) => {
        memory.sync(transform).then(() => {
          console.log('done');
        });
      })
      .catch((err) => {
        logError(
          Severity.error,
          errorReporter,
          infoMsg(err, 'IndexedDB Pull error: ')
        );
      });
  }
  dispatch({
    payload: undefined,
    type: IMPORT_COMPLETE,
  });
};
export const importProjectFromElectron = (
  files: FileList,
  projectid: number,
  auth: Auth,
  errorReporter: any,
  pendingmsg: string,
  completemsg: string
) => (dispatch: any) => {
  dispatch({
    payload: pendingmsg,
    type: IMPORT_PENDING,
  });
  var url =
    API_CONFIG.host + '/api/offlineData/project/import/' + files[0].name;
  Axios.get(url, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then((response) => {
      const filename = response.data.data.attributes.message;
      const xhr = new XMLHttpRequest();
      /* FUTURE TODO Limit is 5G, but it's recommended to use a multipart upload > 100M */
      xhr.open('PUT', response.data.data.attributes.fileurl, true);
      xhr.setRequestHeader(
        'Content-Type',
        response.data.data.attributes.contenttype
      );
      xhr.send(files[0].slice());
      xhr.onload = () => {
        if (xhr.status < 300) {
          // console.log('upload item ' + files[0].name + ' succeeded.');
          /* tell it to process the file now */
          url =
            API_CONFIG.host +
            '/api/offlineData/project/import/' +
            projectid.toString() +
            '/' +
            filename;
          Axios.put(url, null, {
            headers: {
              Authorization: 'Bearer ' + auth.accessToken,
            },
          })
            .then((response) => {
              // console.log(response);
              if (response.data.status === 200)
                dispatch({
                  payload: { status: completemsg, msg: response.data.message },
                  type: IMPORT_SUCCESS,
                });
              else {
                logError(
                  Severity.info,
                  errorReporter,
                  infoMsg(response.data.message, 'Import Error')
                );
                dispatch({
                  payload: errorStatus(
                    response.data.status,
                    response.data.message
                  ),
                  type: IMPORT_ERROR,
                });
              }
            })
            .catch((reason) => {
              logError(
                Severity.info,
                errorReporter,
                infoMsg(reason.data.message, 'Import error')
              );
              dispatch({
                payload: errorStatus(-1, reason.toString()),
                type: IMPORT_ERROR,
              });
            });
        } else {
          logError(
            Severity.info,
            errorReporter,
            `upload ${files[0].name}: (${xhr.status}) ${xhr.responseText}`
          );
          dispatch({
            payload: errorStatus(xhr.status, xhr.responseText),
            type: IMPORT_ERROR,
          });
        }
      };
    })
    .catch((reason) => {
      logError(Severity.info, errorReporter, infoMsg(reason, 'Import Error'));
      dispatch({
        payload: errorStatus(-1, reason.toString()),
        type: IMPORT_ERROR,
      });
    });
};

export const importProjectToElectron = (
  filepath: string,
  memory: Memory,
  backup: IndexedDBSource,
  orbitError: (ex: IApiError) => void,
  pendingmsg: string,
  completemsg: string,
  oldfilemsg: string
) => (dispatch: any) => {
  var tb: TransformBuilder = new TransformBuilder();
  var oparray: Operation[] = [];

  function processFile(file: string, ser: JSONAPISerializerCustom) {
    var data = fs.readFileSync(file);
    var json = ser.deserialize(JSON.parse(data.toString()) as ResourceDocument);
    if (isArray(json.data))
      json.data.forEach((item) =>
        insertData(item, memory, tb, oparray, orbitError, true, true)
      );
    else insertData(json.data, memory, tb, oparray, orbitError, true, true);
  }
  if (fs.existsSync(path.join(filepath, 'H_passagesections.json'))) {
    dispatch({
      payload: errorStatus(-1, oldfilemsg),
      type: IMPORT_ERROR,
    });
    return;
  }
  dispatch({
    payload: pendingmsg,
    type: IMPORT_PENDING,
  });
  fs.readdir(filepath, async function (err, files) {
    if (err) {
      dispatch({
        payload: errorStatus(err.errno, err.message),
        type: IMPORT_ERROR,
      });
    } else {
      const s: JSONAPISerializerSettings = {
        schema: memory.schema,
        keyMap: memory.keyMap,
      };
      const ser = new JSONAPISerializerCustom(s);
      ser.resourceKey = () => {
        return 'remoteId';
      };
      for (let index = 0; index < files.length; index++) {
        processFile(path.join(filepath, files[index]), ser);
      }
      await backup
        .push(oparray)
        .then((res) => {
          dispatch({
            payload: { status: completemsg, msg: '' },
            type: IMPORT_SUCCESS,
          });
        })
        .catch((err) => {
          orbitError(orbitInfo(err, 'Backup update error'));
          dispatch({
            payload: errorStatus(undefined, err.toString()),
            type: IMPORT_ERROR,
          });
        });
    }
  });
};
