import Axios, { AxiosError } from 'axios';
import path from 'path';
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

export const exportComplete = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: EXPORT_COMPLETE,
  });
};
const isElectron = process.env.REACT_APP_MODE === 'electron';

export const exportProject = (
  exportType: string,
  memory: Memory,
  projectid: number,
  userid: number,
  auth: Auth,
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
      .then(response => {
        dispatch({
          payload: response,
          type: EXPORT_SUCCESS,
        });
      })
      .catch((err: Error) => {
        console.log('export failed.');
        console.log(err);
        dispatch({
          payload: errorStatus(-1, err.message),
          type: EXPORT_ERROR,
        });
      });
  } else {
    /* ignore export type for now -- online is always full backup */
    Axios.get(API_CONFIG.host + '/api/offlineData/project/' + projectid, {
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
      timeout: 0, //wait forever
    })
      .then(response => {
        console.log(response);
        dispatch({
          payload: response.data,
          type: EXPORT_SUCCESS,
        });
      })
      .catch((err: AxiosError) => {
        console.log('export failed.');
        console.log(err);
        dispatch({
          payload: errStatus(err),
          type: EXPORT_ERROR,
        });
      });
  }
};
export const importComplete = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: IMPORT_COMPLETE,
  });
};
export const importProjectFromElectron = (
  files: FileList,
  projectid: number,
  auth: Auth,
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
    .then(response => {
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
          console.log('upload item ' + files[0].name + ' succeeded.');
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
            .then(response => {
              console.log(response);
              if (response.data.status === 200)
                dispatch({
                  payload: { status: completemsg, msg: response.data.message },
                  type: IMPORT_SUCCESS,
                });
              else
                dispatch({
                  payload: errorStatus(
                    response.data.status,
                    response.data.message
                  ),
                  type: IMPORT_ERROR,
                });
            })
            .catch(reason => {
              console.log(reason);
              dispatch({
                payload: errorStatus(-1, reason.toString()),
                type: IMPORT_ERROR,
              });
            });
        } else {
          console.log('upload ' + files[0].name + ' failed.');
          console.log(JSON.stringify(xhr.response));
          dispatch({
            payload: errorStatus(xhr.status, xhr.responseText),
            type: IMPORT_ERROR,
          });
        }
      };
    })
    .catch(reason => {
      console.log(reason);
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
      json.data.forEach(item =>
        insertData(item, memory, tb, oparray, true, true)
      );
    else insertData(json.data, memory, tb, oparray, true, true);
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
  fs.readdir(filepath, async function(err, files) {
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
      await memory
        .update(oparray)
        .then(async response => {
          await backup
            .push(oparray)
            .then(res => {
              dispatch({
                payload: { status: completemsg, msg: '' },
                type: IMPORT_SUCCESS,
              });
              console.log(memory.cache.query(q => q.findRecords('project')));
            })
            .catch(err => {
              console.log('backup update err', err);
              dispatch({
                payload: errorStatus(undefined, err.toString()),
                type: IMPORT_ERROR,
              });
            });
        })
        .catch(err => {
          console.log('memory update err', err);
          dispatch({
            payload: errorStatus(undefined, err.toString()),
            type: IMPORT_ERROR,
          });
        });
    }
  });
};
