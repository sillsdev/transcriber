import Axios, { AxiosError } from 'axios';
import path from 'path-browserify';
import {
  Comment,
  Project,
  Plan,
  Section,
  MediaFile,
  Passage,
  PassageStateChange,
  GroupMembership,
  Group,
  ProjectIntegration,
  OfflineProject,
  VProject,
  Discussion,
  OrgWorkflowStep,
  IApiError,
} from '../../model';
import { API_CONFIG } from '../../api-variable';
import { ResourceDocument } from '@orbit/jsonapi';
import {
  getSerializer,
  JSONAPISerializerCustom,
} from '../../serializers/JSONAPISerializerCustom';
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
  ExportType,
} from './types';
import { errStatus, errorStatus } from '../AxiosStatus';
import Memory from '@orbit/memory';
import { TransformBuilder, Operation, QueryBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { electronExport } from './electronExport';
import {
  remoteIdGuid,
  related,
  insertData,
  remoteId,
  findRecord,
  mediaArtifacts,
  IExportArtifacts,
  ArtifactTypeSlug,
} from '../../crud';
import { logError, orbitInfo, Severity } from '../../utils';
import Coordinator from '@orbit/coordinator';
import { axiosPost } from '../../utils/axios';
import { updateBackTranslationType } from '../../crud/updateBackTranslationType';
const ipc = (window as any)?.electron;

export const exportComplete = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: EXPORT_COMPLETE,
  });
};

export const exportProject =
  (
    exportType: ExportType,
    artifactType: string | null | undefined,
    memory: Memory,
    backup: IndexedDBSource,
    projectid: number | string,
    fingerprint: string,
    userid: number | string,
    numberOfMedia: number,
    token: string | null,
    errorReporter: any, //global errorReporter
    pendingmsg: string,
    nodatamsg: string,
    noNewAllowedmsg: string,
    localizedArtifact: string,
    getOfflineProject: (plan: Plan | VProject | string) => OfflineProject,
    target?: string,
    orgWorkflowSteps?: OrgWorkflowStep[]
  ) =>
  async (dispatch: any) => {
    dispatch({
      payload: pendingmsg.replace('{0}%', ''),
      type: EXPORT_PENDING,
    });
    const getProjRec = (projectid: number | string): Project => {
      return memory.cache.query((q: QueryBuilder) =>
        q.findRecord({
          type: 'project',
          id:
            typeof projectid === 'number'
              ? remoteIdGuid('project', projectid.toString(), memory.keyMap)
              : projectid,
        })
      ) as Project;
    };
    if (!token || exportType === ExportType.ITFSYNC) {
      // equivalent to offline ie isElectron and not online
      electronExport(
        exportType,
        artifactType,
        memory,
        backup,
        projectid,
        fingerprint,
        userid,
        nodatamsg,
        noNewAllowedmsg,
        localizedArtifact,
        getOfflineProject,
        target,
        orgWorkflowSteps
      )
        .then((response) => {
          dispatch({
            payload: response,
            type: EXPORT_SUCCESS,
          });
        })
        .catch((err: Error) => {
          logError(Severity.error, errorReporter, err);
          dispatch({
            payload: errorStatus(-1, err.message),
            type: EXPORT_ERROR,
          });
        });
    } else {
      const remProjectId =
        typeof projectid === 'number'
          ? projectid.toString()
          : remoteId('project', projectid, memory.keyMap);
      let start = 0;
      do {
        var projRec = getProjRec(projectid);
        var bodyFormData = new FormData();
        if (artifactType !== undefined) {
          var mediaList = mediaArtifacts({
            memory,
            projRec,
            artifactType,
            target,
            orgWorkflowSteps,
          } as IExportArtifacts)?.map((m) =>
            remoteId('mediafile', m.id, memory.keyMap)
          );
          if (mediaList && mediaList.length > 0) {
            if (artifactType)
              bodyFormData.append('artifactType', localizedArtifact);
            bodyFormData.append('ids', ',' + mediaList.join() + ',');
          } else {
            dispatch({
              payload: errorStatus(-1, nodatamsg),
              type: EXPORT_ERROR,
            });
            return;
          }
        }
        await axiosPost(
          `offlineData/project/export/${exportType}/${remProjectId}/${start}`,
          bodyFormData,
          token
        )
          // eslint-disable-next-line no-loop-func
          .then((response) => {
            var fr = response.data as FileResponse;
            start = Number(fr.id);
            switch (start) {
              case -1:
                dispatch({
                  payload: response.data,
                  type: EXPORT_SUCCESS,
                });
                break;
              case -2:
                dispatch({
                  payload: errorStatus(undefined, fr.message),
                  type: EXPORT_ERROR,
                });
                break;
              default:
                var pct = Math.min(
                  Math.round(start / (numberOfMedia + 15)) * 100,
                  85
                );
                dispatch({
                  payload: pendingmsg.replace('{0}', pct.toString()),
                  type: EXPORT_PENDING,
                });
            }
          })
          // eslint-disable-next-line no-loop-func
          .catch((err: AxiosError) => {
            logError(
              Severity.error,
              errorReporter,
              'Export Failed:' + (err.message || err.toString())
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
const importFromElectron =
  (
    filename: string,
    file: Blob,
    projectid: number,
    token: string | null,
    errorReporter: any, //global errorReporter
    pendingmsg: string,
    completemsg: string
  ) =>
  (dispatch: any) => {
    dispatch({
      payload: pendingmsg.replace('{0}', '1'),
      type: IMPORT_PENDING,
    });
    var url = API_CONFIG.host + '/api/offlineData/project/import/' + filename;
    Axios.get(url, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .then((response) => {
        const filename = response.data.message;
        const xhr = new XMLHttpRequest();
        /* FUTURE TODO Limit is 5G, but it's recommended to use a multipart upload > 100M */
        xhr.open('PUT', response.data.fileURL, true);
        xhr.setRequestHeader('Content-Type', response.data.contentType);
        xhr.send(file.slice());
        xhr.onload = () => {
          if (xhr.status < 300) {
            dispatch({
              payload: pendingmsg.replace('{0}', '20'),
              type: IMPORT_PENDING,
            });
            /* tell it to process the file now */
            if (projectid === 0)
              url = API_CONFIG.host + '/api/offlineData/sync/' + filename;
            else
              url =
                API_CONFIG.host +
                '/api/offlineData/project/import/' +
                projectid.toString() +
                '/' +
                filename;

            Axios.put(url, null, {
              headers: {
                Authorization: 'Bearer ' + token,
              },
            })
              .then((putresponse) => {
                if (putresponse.data.status === 200)
                  dispatch({
                    payload: {
                      status: completemsg,
                      msg: putresponse.data.message,
                    },
                    type: IMPORT_SUCCESS,
                  });
                else {
                  logError(
                    Severity.error,
                    errorReporter,
                    'import error' + putresponse.data.message
                  );
                  dispatch({
                    payload: errorStatus(
                      putresponse.data.status,
                      putresponse.data.message
                    ),
                    type: IMPORT_ERROR,
                  });
                }
              })
              .catch((reason) => {
                logError(
                  Severity.error,
                  errorReporter,
                  'import error' + reason
                );
                dispatch({
                  payload: errorStatus(-1, reason.toString()),
                  type: IMPORT_ERROR,
                });
              });
          } else {
            logError(
              Severity.error,
              errorReporter,
              `upload ${filename}: ${xhr.responseText}`
            );

            dispatch({
              payload: errorStatus(xhr.status, xhr.responseText),
              type: IMPORT_ERROR,
            });
          }
        };
      })
      .catch((reason) => {
        logError(Severity.error, errorReporter, `Import Error: ${reason}`);
        dispatch({
          payload: errorStatus(-1, reason.toString()),
          type: IMPORT_ERROR,
        });
      });
  };

export interface ImportSyncFromElectronProps {
  filename: string;
  file: Buffer;
  token: string | null;
  errorReporter: any;
  pendingmsg: string;
  completemsg: string;
}

export const importSyncFromElectron =
  ({
    filename,
    file,
    token,
    errorReporter,
    pendingmsg,
    completemsg,
  }: ImportSyncFromElectronProps) =>
  (dispatch: any) => {
    dispatch(
      importFromElectron(
        filename,
        new Blob([file]),
        0,
        token,
        errorReporter,
        pendingmsg,
        completemsg
      )
    );
  };

export interface ImportProjectFromElectronProps {
  files: File[];
  projectid: number;
  token: string | null;
  errorReporter: any;
  pendingmsg: string;
  completemsg: string;
}

export const importProjectFromElectron =
  ({
    files,
    projectid,
    token,
    errorReporter,
    pendingmsg,
    completemsg,
  }: ImportProjectFromElectronProps) =>
  (dispatch: any) => {
    dispatch(
      importFromElectron(
        files[0].name,
        files[0],
        projectid,
        token,
        errorReporter,
        pendingmsg,
        completemsg
      )
    );
  };

export interface ImportProjectToElectronProps {
  filepath: string;
  dataDate: string;
  version: number;
  coordinator: Coordinator;
  offlineOnly: boolean;
  AddProjectLoaded: (project: string) => void;
  reportError: (ex: IApiError) => void;
  getTypeId: (slug: string) => string | null;
  pendingmsg: string;
  completemsg: string;
  oldfilemsg: string;
  token: string | null;
  user: string;
  errorReporter: any;
  offlineSetup: () => Promise<void>;
}

export const importProjectToElectron =
  ({
    filepath,
    dataDate,
    version,
    coordinator,
    offlineOnly,
    AddProjectLoaded,
    reportError,
    getTypeId,
    pendingmsg,
    completemsg,
    oldfilemsg,
    token,
    user,
    errorReporter,
    offlineSetup,
  }: ImportProjectToElectronProps) =>
  async (dispatch: any) => {
    var tb: TransformBuilder = new TransformBuilder();
    var oparray: Operation[] = [];

    const memory = coordinator.getSource('memory') as Memory;
    const backup = coordinator.getSource('backup') as IndexedDBSource;

    const importJson = async (
      ser: JSONAPISerializerCustom,
      file: string,
      folder?: string
    ) => {
      if (folder) {
        file = path.join(folder, file);
      }
      const data = (await ipc?.read(file, 'utf-8')) as string;
      return ser.deserialize(JSON.parse(data) as ResourceDocument);
    };

    async function getProjectFromFile(ser: JSONAPISerializerCustom) {
      let json = await importJson(ser, 'D_projects.json', filepath);
      var project: any;
      if (Array.isArray(json.data)) project = json.data[0];
      else project = json.data;
      var id = project.id;
      if (project.keys) {
        id = remoteIdGuid(
          project.type,
          project.keys['remoteId'],
          memory.keyMap
        );
      }
      try {
        var rec = memory.cache.query((q) =>
          q.findRecord({ type: project.type, id: id })
        ) as Project;
        return rec;
      } catch {
        return undefined;
      }
    }
    async function removeProject(ser: JSONAPISerializerCustom) {
      var rec = await getProjectFromFile(ser);

      if (!rec) return;

      var group = memory.cache.query((q) =>
        q.findRecord({ type: 'group', id: related(rec, 'group') })
      ) as Group;
      //if this is the only project using this group, then delete the group memberships
      //if not, we'd best leave them alone just in case
      var projectsWithGroup = (
        memory.cache.query((q) => q.findRecords('project')) as Project[]
      ).filter((p) => related(p, 'group') === group.id);
      var gmids: string[] = [];
      var userids: string[] = [];
      if (projectsWithGroup.length === 1) {
        var gms = (
          memory.cache.query((q) =>
            q.findRecords('groupmembership')
          ) as GroupMembership[]
        ).filter((gm) => related(gm, 'group') === group.id);
        gms.forEach((gm) => {
          gmids.push(gm.id);
          var thisuser = related(gm, 'user');
          var groupsForUser = (
            memory.cache.query((q) =>
              q.findRecords('groupmembership')
            ) as GroupMembership[]
          ).filter((ugm) => related(ugm, 'user') === thisuser);
          if (groupsForUser.length === 1) userids.push(thisuser);
        });
      }
      var projintids = (
        memory.cache.query((q) =>
          q.findRecords('projectintegration')
        ) as ProjectIntegration[]
      )
        .filter((pl) => related(pl, 'project') === rec?.id)
        .map((pi) => pi.id);
      var planids = (memory.cache.query((q) => q.findRecords('plan')) as Plan[])
        .filter((pl) => related(pl, 'project') === rec?.id)
        .map((pl) => pl.id);
      var sectionids = (
        memory.cache.query((q) => q.findRecords('section')) as Section[]
      )
        .filter((s) => planids.includes(related(s, 'plan')))
        .map((s) => s.id);
      var passageids = (
        memory.cache.query((q) => q.findRecords('passage')) as Passage[]
      )
        .filter((p) => sectionids.includes(related(p, 'section')))
        .map((p) => p.id);
      var pscids = (
        memory.cache.query((q) =>
          q.findRecords('passagestatechange')
        ) as PassageStateChange[]
      )
        .filter((psc) => passageids.includes(related(psc, 'passage')))
        .map((p) => p.id);
      var mediaids = (
        memory.cache.query((q) => q.findRecords('mediafile')) as MediaFile[]
      )
        .filter(
          (m) =>
            planids.includes(related(m, 'plan')) &&
            related(m, 'artifacttype') !==
              getTypeId(ArtifactTypeSlug.IntellectualProperty)
        )
        .map((m) => m.id);
      var discussionids = (
        memory.cache.query((q) => q.findRecords('discussion')) as Discussion[]
      )
        .filter((d) => mediaids.includes(related(d, 'mediafile')))
        .map((d) => d.id);
      var commentids = (
        memory.cache.query((q) => q.findRecords('comment')) as Comment[]
      )
        .filter((c) => discussionids.includes(related(c, 'discussion')))
        .map((c) => c.id);

      dispatch({
        payload: pendingmsg.replace('{0}', '5'),
        type: IMPORT_PENDING,
      });

      var delOpArray: Operation[] = [];
      commentids.forEach((id) =>
        delOpArray.push(tb.removeRecord({ type: 'comment', id: id }))
      );
      discussionids.forEach((id) =>
        delOpArray.push(tb.removeRecord({ type: 'discussion', id: id }))
      );
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
      } catch (err: any) {
        reportError(orbitInfo(err, title));
        throw err;
      }
    }
    async function saveToBackup(oparray: Operation[], title: string) {
      if (!coordinator.activated) {
        try {
          return await backup.push(oparray);
        } catch (err: any) {
          reportError(orbitInfo(err, title));
          throw err;
        }
      }
      return null;
    }
    async function syncPassageState(
      project: Project,
      tb: TransformBuilder,
      oparray: Operation[]
    ) {
      var plans = memory.cache.query((q) => q.findRecords('plan')) as Plan[];
      var planids = plans
        .filter((p) => related(p, 'project') === project.id)
        .map((p) => p.id);

      var media = (
        memory.cache.query((q) => q.findRecords('mediafile')) as MediaFile[]
      ).filter(
        (m) => planids.includes(related(m, 'plan')) && related(m, 'passage')
      );

      media.forEach((m) => {
        var passage = findRecord(
          memory,
          'passage',
          related(m, 'passage')
        ) as Passage;
        if (passage) {
          m.attributes.transcriptionstate = passage.attributes.state;
          oparray.push(tb.updateRecord(m));
        }
      });
    }

    async function processFile(
      file: string,
      ser: JSONAPISerializerCustom,
      dataDate: string
    ) {
      let json = await importJson(ser, file);
      var project: Project | undefined = undefined;
      if (!Array.isArray(json.data)) json.data = [json.data];
      for (let n = 0; n < json.data.length; n += 1) {
        const item = json.data[n];
        project =
          (await insertData(
            item,
            memory,
            backup,
            tb,
            oparray,
            reportError,
            true,
            true,
            dataDate
          )) || project;
      }

      return project;
    }

    if (await ipc?.exists(path.join(filepath, 'H_passagesections.json'))) {
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
    const result = (await ipc?.readDir(filepath)) as
      | string[]
      | NodeJS.ErrnoException;
    const err = !Array.isArray(result) ? result : undefined;
    if (err) {
      dispatch({
        payload: errorStatus(err.errno, err.message),
        type: IMPORT_ERROR,
      });
    } else {
      const files = result as string[];
      const ser = getSerializer(memory, offlineOnly);
      try {
        //remove all project data
        await removeProject(ser);
        dispatch({
          payload: pendingmsg.replace('{0}', '20'),
          type: IMPORT_PENDING,
        });
        var project: Project | undefined = undefined;
        for (let index = 0; index < files.length; index++) {
          project =
            (await processFile(
              path.join(filepath, files[index]),
              ser,
              dataDate
            )) || project;
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
        if (version < 4 && project) {
          syncPassageState(project, tb, oparray);
        }
        dispatch({
          payload: pendingmsg.replace('{0}', '90'),
          type: IMPORT_PENDING,
        });
        if (oparray.length > 0) {
          await saveToMemory(oparray, 'remove extra records');
          await saveToBackup(oparray, 'remove extra records from backup');
        }
        if (parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 4) {
          updateBackTranslationType(
            memory,
            token,
            user,
            errorReporter,
            offlineSetup
          );
        }
        AddProjectLoaded(project?.id || '');
        dispatch({
          payload: { status: completemsg, msg: '' },
          type: IMPORT_SUCCESS,
        });
      } catch (err: any) {
        dispatch({
          payload: errorStatus(undefined, err.message),
          type: IMPORT_ERROR,
        });
      }
    }
  };
