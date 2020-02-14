import Axios, { AxiosError } from 'axios';
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

import { Record, TransformBuilder, Operation } from '@orbit/data';
import { isArray } from 'util';
import IndexedDBSource from '@orbit/indexeddb';

export const exportComplete = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: EXPORT_COMPLETE,
  });
};

export const exportProject = (
  projectid: number,
  auth: Auth,
  pendingmsg: string
) => (dispatch: any) => {
  dispatch({
    payload: pendingmsg,
    type: EXPORT_PENDING,
  });

  Axios.get(API_CONFIG.host + '/api/offlineData/project/' + projectid, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
    timeout: 30000,
  })
    .then(response => {
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
};
export const importComplete = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: IMPORT_COMPLETE,
  });
};

export const importProject = (
  filepath: string,
  memory: Memory,
  pendingmsg: string,
  completemsg: string
) => (dispatch: any) => {
  var tb: TransformBuilder = new TransformBuilder();
  var oparray: Operation[] = [];
  const backup = new IndexedDBSource({
    schema: memory.schema,
    keyMap: memory.keyMap,
    name: 'backup',
    namespace: 'transcriber',
  });
  backup.reset();

  async function insertData(item: Record) {
    memory.schema.initializeRecord(item);
    oparray.push(tb.addRecord(item));
  }
  dispatch({
    payload: pendingmsg,
    type: IMPORT_PENDING,
  });
  fs.readdir(filepath + 'data', async function(err, files) {
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
      files.forEach(function(file) {
        var data = fs.readFileSync(filepath + 'data/' + file);
        var json = ser.deserialize(
          JSON.parse(data.toString()) as ResourceDocument
        );
        if (isArray(json.data)) json.data.forEach(insertData);
        else insertData(json.data);
      });

      memory
        .update(oparray)
        .then(response => {
          backup
            .push(oparray)
            .then(res => {
              dispatch({
                payload: completemsg,
                type: IMPORT_SUCCESS,
              });
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
