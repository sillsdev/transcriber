import Axios from 'axios';
import { API_CONFIG } from '../../api-variable';
import {
  UPLOAD_LIST,
  UPLOAD_ITEM_PENDING,
  UPLOAD_ITEM_CREATED,
  UPLOAD_ITEM_SUCCEEDED,
  UPLOAD_ITEM_FAILED,
  UPLOAD_COMPLETE,
} from './types';
import {
  dataPath,
  infoMsg,
  logError,
  PathType,
  Severity,
  createPathFolder,
  removeExtension,
} from '../../utils';
import moment from 'moment';
import _ from 'lodash';
import { UploadType, SIZELIMIT } from '../../components/MediaUpload';
const ipc = (window as any)?.electron;
var path = require('path-browserify');

export const uploadFiles = (files: File[]) => (dispatch: any) => {
  dispatch({
    payload: files,
    type: UPLOAD_LIST,
  });
};
const nextVersion = (fileName: string) => {
  var { name, ext } = removeExtension(fileName);
  var { name: origName, ext: version } = removeExtension(name);
  if (version && version.length > 3 && version.startsWith('ver')) {
    var ver = Number(version.substring(3)) + 1;
    return `${origName}.ver${ver.toString().padStart(2, '0')}.${ext}`;
  }
  return `${name}.ver02.${ext}`;
};

let writeName = ''; // used for message if copy fails

export const writeFileLocal = async (file: File, remoteName?: string) => {
  var local = { localname: '' };
  const filePath = (file as any)?.path || '';
  await dataPath(
    remoteName ? remoteName : `http://${filePath}`,
    PathType.MEDIA,
    local
  );
  writeName = local.localname;
  if (!remoteName && filePath === '') writeName += path.sep + file.name;
  await createPathFolder(writeName);
  while (await ipc?.exists(writeName)) {
    writeName = nextVersion(writeName);
  }
  if (filePath) {
    await ipc?.copyFile(filePath, writeName);
  } else {
    const reader = new FileReader();
    reader.onload = (evt) => {
      ipc?.write(writeName, evt?.target?.result, {
        encoding: 'binary',
        flag: 'wx', //write - fail if file exists
      });
    };
    reader.readAsBinaryString(file);
  }
  return path.join(PathType.MEDIA, writeName.split(path.sep).pop());
};
const isNotDownloadable = (content: string) => /^text/.test(content); //Links also start with text/

const deleteMediaAfterFailedUpload = (
  id: number,
  token: string,
  errorReporter: any
) => {
  Axios.delete(API_CONFIG.host + '/api/mediafiles/' + id, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  }).catch((err) => {
    logError(
      Severity.error,
      errorReporter,
      infoMsg(err, `unable to remove orphaned mediafile ${id}`)
    );
  });
};

export const uploadFile = (
  data: any,
  file: File,
  errorReporter: any
): Promise<{ statusNum: number; statusText: string }> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', data.audioUrl, true);
    xhr.setRequestHeader('Content-Type', data.contentType);
    xhr.send(file.slice());
    xhr.onload = () => {
      if (xhr.status < 300) {
        resolve({ statusNum: 0, statusText: '' });
      } else {
        logError(
          Severity.error,
          errorReporter,
          `upload ${file.name}: (${xhr.status}) ${xhr.responseText}`
        );
        reject({ statusNum: 500, statusText: 'upload failed' });
      }
    };
    xhr.onerror = (evt: any) => {
      reject({ statusNum: 500, statusText: 'upload failed' });
    };
    xhr.onabort = (evt: any) => {
      reject({ statusNum: 500, statusText: 'upload aborted' });
    };
  });
};

export interface NextUploadProps {
  record: any;
  files: File[];
  n: number;
  token: string;
  offline: boolean;
  errorReporter: any;
  uploadType: UploadType;
  cb?: (n: number, success: boolean, data?: any) => void;
}
export const nextUpload =
  ({
    record,
    files,
    n,
    token,
    offline,
    errorReporter,
    uploadType,
    cb,
  }: NextUploadProps) =>
  (dispatch: any) => {
    dispatch({ payload: n, type: UPLOAD_ITEM_PENDING });
    const sendError = (n: number, message: string, mediaid?: any) => {
      dispatch({
        payload: {
          current: n,
          error: message,
          mediaid,
        },
        type: UPLOAD_ITEM_FAILED,
      });
      if (cb) cb(n, false);
    };
    const isDownloadable = !isNotDownloadable(files[n]?.type);

    const acceptExtPat =
      /\.wav$|\.mp3$|\.m4a$|\.ogg$|\.webm$|\.pdf$|\.png$|\.jpg$/i;
    if (isDownloadable && !acceptExtPat.test(record.originalFile)) {
      sendError(n, `${files[n].name}:unsupported`);
      return;
    }
    if (files[n].size > SIZELIMIT(uploadType) * 1000000) {
      sendError(
        n,
        `${files[n].name}:toobig:${(files[n].size / 1000000).toFixed(2)}`
      );
      return;
    }
    if (offline) {
      if (!isDownloadable) {
        if (cb) cb(n, true, { ...record });
      } else
        try {
          writeFileLocal(files[n]).then((filename: string) => {
            if (cb) cb(n, true, { ...record, audioUrl: filename });
          });
        } catch (err: any) {
          logError(
            Severity.error,
            errorReporter,
            infoMsg(err, `failed getting name: ${files.length}`)
          );
          sendError(n, `${files[n].name} failed local write`);
        }
      return;
    }
    const completeCB = (
      success: boolean,
      data: any,
      statusNum: number,
      statusText: string
    ) => {
      if (success) {
        dispatch({ payload: n, type: UPLOAD_ITEM_SUCCEEDED });
        if (cb) cb(n, true, data);
      } else {
        dispatch({
          payload: {
            current: n,
            error: `upload ${files[n].name}: (${statusNum}) ${statusText}`,
          },
          type: UPLOAD_ITEM_FAILED,
        });
        if (cb) cb(n, false, data);
      }
    };

    const toVnd = (record: any) => {
      var vnd = {
        data: {
          type: 'mediafiles',
          attributes: {
            'version-number': record.versionNumber,
            'original-file': record.originalFile,
            'content-type': record.contentType,
            'eaf-url': record.eafUrl,
            'date-created': moment.utc(),
            'source-segments': record.sourceSegments,
            'performed-by': record.performedBy,
            topic: record.topic,
          },
          relationships: {
            'last-modified-by-user': {
              data: {
                type: 'users',
                id: record.userId?.toString(),
              },
            },
          },
        },
      } as any;
      if (record.passageId)
        vnd.data.relationships.passage = {
          data: { type: 'passages', id: record.passageId.toString() },
        };
      if (record.planId)
        vnd.data.relationships.plan = {
          data: { type: 'plans', id: record.planId.toString() },
        };
      if (record.artifactTypeId)
        vnd.data.relationships['artifact-type'] = {
          data: { type: 'artifacttypes', id: record.artifactTypeId.toString() },
        };
      if (record.sourceMediaId)
        vnd.data.relationships['source-media'] = {
          data: { type: 'mediafiles', id: record.sourceMediaId.toString() },
        };
      if (record.recordedbyUserId)
        vnd.data.relationships['recordedby-user'] = {
          data: { type: 'users', id: record.recordedbyUserId.toString() },
        };
      return vnd;
    };
    const fromVnd = (data: any) => {
      var json = _.mapKeys(data.data.attributes, (v, k) => _.camelCase(k));
      json.id = data.data.id;
      json.stringId = json.id.toString();
      return json;
    };

    const postIt = async () => {
      var iTries = 5;
      while (iTries > 0) {
        try {
          //we have to use an axios call here because orbit is asynchronous
          //(even if you await)
          var response = await Axios.post(
            API_CONFIG.host + '/api/mediafiles',
            vndRecord,
            {
              headers: {
                'Content-Type': 'application/vnd.api+json',
                Authorization: 'Bearer ' + token,
              },
            }
          );
          dispatch({ payload: n, type: UPLOAD_ITEM_CREATED });
          return fromVnd(response.data);
        } catch (err: any) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          iTries--;
        }
      }
      sendError(n, `Upload ${files[n].name} failed.`);
      return undefined;
    };
    var vndRecord = toVnd(record);

    postIt().then(async (json) => {
      if (json) {
        if (isNotDownloadable(json.contentType)) {
          if (completeCB) completeCB(true, json, 0, '');
          return;
        }
        let statusNum = 0;
        let statusText = '';
        for (let iTries = 5; iTries; iTries--) {
          try {
            let status = await uploadFile(json, files[n], errorReporter);
            if (status.statusNum === 0) {
              completeCB(true, json, status.statusNum, status.statusText);
              return;
            }
            statusNum = status.statusNum;
            statusText = status.statusText;
          } catch (err) {
            logError(
              Severity.error,
              errorReporter,
              infoMsg(err as Error, `Upload ${files[n].name} failed.`)
            );
            statusNum = 500;
            statusText = (err as Error).message;
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } finally {
            if (iTries === 1) {
              deleteMediaAfterFailedUpload(json.id, token, errorReporter);
              completeCB(false, undefined, statusNum, statusText);
            }
          }
        }
      }
    });
  };
export const uploadComplete = () => {
  return { type: UPLOAD_COMPLETE };
};
