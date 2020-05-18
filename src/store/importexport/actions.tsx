import Axios, { AxiosError } from 'axios';
import path from 'path';
import {
  IApiError,
  Project,
  Plan,
  Section,
  MediaFile,
  Passage,
  PassageStateChange,
  GroupMembership,
  Group,
} from '../../model';
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
  FileResponse,
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
import { infoMsg, orbitInfo, remoteIdGuid, related } from '../../utils';
import { isElectron } from '../../api-variable';
import ProjectIntegration from '../../model/projectintegration';

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
  numberOfMedia: number,
  auth: Auth,
  errorReporter: any,
  pendingmsg: string
) => async (dispatch: any) => {
  dispatch({
    payload: pendingmsg.replace('{0}%', ''),
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
    let start = 0;
    do {
      await Axios.get(
        API_CONFIG.host +
          '/api/offlineData/project/export/' +
          projectid +
          '/' +
          start,
        {
          headers: {
            Authorization: 'Bearer ' + auth.accessToken,
          },
          timeout: 0, //wait forever
        }
      )
        // eslint-disable-next-line no-loop-func
        .then((response) => {
          var fr = response.data as FileResponse;
          start = Number(fr.data.id);
          if (start === -1) {
            dispatch({
              payload: response.data,
              type: EXPORT_SUCCESS,
            });
          } else {
            dispatch({
              payload: pendingmsg.replace(
                '{0}',
                Math.round((start / (numberOfMedia + 10)) * 100).toString()
              ),
              type: EXPORT_PENDING,
            });
          }
        })
        // eslint-disable-next-line no-loop-func
        .catch((err: AxiosError) => {
          logError(
            Severity.info,
            errorReporter,
            infoMsg(err, 'Export failed: ')
          );
          start = -1;
          dispatch({
            payload: errStatus(err),
            type: EXPORT_ERROR,
          });
        });
    } while (start > -1);
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
  errorReporter: any,
  pendingmsg: string,
  completemsg: string
) => (dispatch: any) => {
  dispatch({
    payload: pendingmsg.replace('{0}', '1'),
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
          dispatch({
            payload: pendingmsg.replace('{0}', '20'),
            type: IMPORT_PENDING,
          });
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
              if (response.data.status === 200)
                dispatch({
                  payload: { status: completemsg, msg: response.data.message },
                  type: IMPORT_SUCCESS,
                });
              else {
                logError(Severity.info, errorReporter, response.data.message);
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
              logError(Severity.error, errorReporter, reason.toString());
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
      logError(
        Severity.info,
        errorReporter,
        infoMsg(new Error(reason.toString()), 'Import Error')
      );
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
  coordinatorActivated: boolean,
  orbitError: (ex: IApiError) => void,
  pendingmsg: string,
  completemsg: string,
  oldfilemsg: string
) => (dispatch: any) => {
  var tb: TransformBuilder = new TransformBuilder();
  var oparray: Operation[] = [];

  async function removeProject(ser: JSONAPISerializerCustom) {
    var file = path.join(filepath, 'D_projects.json');
    var data = fs.readFileSync(file);
    var json = ser.deserialize(JSON.parse(data.toString()) as ResourceDocument);
    var project: any;
    if (Array.isArray(json.data)) project = json.data[0];
    else project = json.data;
    if (project.keys === undefined) return;
    var id = remoteIdGuid(
      project.type,
      project.keys['remoteId'],
      memory.keyMap
    );
    try {
      var rec = memory.cache.query((q) =>
        q.findRecord({ type: project.type, id: id })
      ) as Project;
    } catch {
      return;
    }
    var group = memory.cache.query((q) =>
      q.findRecord({ type: 'group', id: related(rec, 'group') })
    ) as Group;
    //if this is the only project using this group, then delete the group memberships
    //if not, we'd best leave them alone just in case
    var projectsWithGroup = (memory.cache.query((q) =>
      q.findRecords('project')
    ) as Project[]).filter((p) => related(p, 'group') === group.id);
    var gmids: string[] = [];
    var userids: string[] = [];
    if (projectsWithGroup.length === 1) {
      var gms = (memory.cache.query((q) =>
        q.findRecords('groupmembership')
      ) as GroupMembership[]).filter((gm) => related(gm, 'group') === group.id);
      gms.forEach((gm) => {
        gmids.push(gm.id);
        var thisuser = related(gm, 'user');
        var groupsForUser = (memory.cache.query((q) =>
          q.findRecords('groupmembership')
        ) as GroupMembership[]).filter(
          (ugm) => related(ugm, 'user') === thisuser
        );
        if (groupsForUser.length === 1) userids.push(thisuser);
      });
    }
    var projintids = (memory.cache.query((q) =>
      q.findRecords('projectintegration')
    ) as ProjectIntegration[])
      .filter((pl) => related(pl, 'project') === rec.id)
      .map((pi) => pi.id);
    var planids = (memory.cache.query((q) => q.findRecords('plan')) as Plan[])
      .filter((pl) => related(pl, 'project') === rec.id)
      .map((pl) => pl.id);
    var sectionids = (memory.cache.query((q) =>
      q.findRecords('section')
    ) as Section[])
      .filter((s) => planids.includes(related(s, 'plan')))
      .map((s) => s.id);
    var passageids = (memory.cache.query((q) =>
      q.findRecords('passage')
    ) as Passage[])
      .filter((p) => sectionids.includes(related(p, 'section')))
      .map((p) => p.id);
    var pscids = (memory.cache.query((q) =>
      q.findRecords('passagestatechange')
    ) as PassageStateChange[])
      .filter((psc) => passageids.includes(related(psc, 'passage')))
      .map((p) => p.id);
    var mediaids = (memory.cache.query((q) =>
      q.findRecords('mediafile')
    ) as MediaFile[])
      .filter((m) => planids.includes(related(m, 'plan')))
      .map((m) => m.id);
    dispatch({
      payload: pendingmsg.replace('{0}', '5'),
      type: IMPORT_PENDING,
    });
    var delOpArray: Operation[] = [];
    mediaids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'mediafile', id: id }))
    );
    pscids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'passagestatechange', id: id }))
    );
    passageids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'passage', id: id }))
    );
    sectionids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'section', id: id }))
    );
    planids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'plan', id: id }))
    );
    projintids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'projectintegration', id: id }))
    );
    gmids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'groupmembership', id: id }))
    );
    userids.forEach((id) =>
      delOpArray.push(tb.removeRecord({ type: 'user', id: id }))
    );
    dispatch({
      payload: pendingmsg.replace('{0}', '10'),
      type: IMPORT_PENDING,
    });
    await saveToMemory(delOpArray, 'remove project');
    await saveToBackup(delOpArray, 'remove project from backup');
    dispatch({
      payload: pendingmsg.replace('{0}', '15'),
      type: IMPORT_PENDING,
    });
  }
  async function saveToMemory(oparray: Operation[], title: string) {
    try {
      return await memory.update(oparray);
    } catch (err) {
      orbitError(orbitInfo(err, title));
      throw err;
    }
  }
  async function saveToBackup(oparray: Operation[], title: string) {
    if (!coordinatorActivated) {
      try {
        return await backup.push(oparray);
      } catch (err) {
        orbitError(orbitInfo(err, title));
        throw err;
      }
    }
    return null;
  }

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
    payload: pendingmsg.replace('{0}', '1'),
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
      try {
        //remove all project data
        await removeProject(ser);
        dispatch({
          payload: pendingmsg.replace('{0}', '20'),
          type: IMPORT_PENDING,
        });

        for (let index = 0; index < files.length; index++) {
          processFile(path.join(filepath, files[index]), ser);
        }
        dispatch({
          payload: pendingmsg.replace('{0}', '25'),
          type: IMPORT_PENDING,
        });
        await saveToMemory(oparray, 'import project to memory');
        await saveToBackup(oparray, 'import project to backup');
        dispatch({
          payload: pendingmsg.replace('{0}', '80'),
          type: IMPORT_PENDING,
        });
        //remove records with no attributes...i.e. groups created from user's groupmemberships that we didn't import
        oparray = [];
        var allrecs = await backup.pull((q) => q.findRecords());

        allrecs[0].operations.forEach((r: any) => {
          if (r.record.attributes === undefined) {
            oparray.push(
              tb.removeRecord({ type: r.record.type, id: r.record.id })
            );
          }
        });
        dispatch({
          payload: pendingmsg.replace('{0}', '90'),
          type: IMPORT_PENDING,
        });
        if (oparray.length > 0) {
          await saveToMemory(oparray, 'remove extra records');
          await saveToBackup(oparray, 'remove extra records from backup');
        }
        dispatch({
          payload: { status: completemsg, msg: '' },
          type: IMPORT_SUCCESS,
        });
      } catch (err) {
        dispatch({
          payload: errorStatus(undefined, err.message),
          type: IMPORT_ERROR,
        });
      }
    }
  });
};
