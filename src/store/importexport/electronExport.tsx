import { ExportType, FileResponse } from './types';
import AdmZip from 'adm-zip';
import path from 'path-browserify';
import moment from 'moment';
import {
  Project,
  User,
  MediaFile,
  Organization,
  GroupMembership,
  Plan,
  Section,
  Passage,
  Group,
  OfflineProject,
  VProject,
  Discussion,
  OrgWorkflowStep,
  OrgKeytermTarget,
  OrgKeyterm,
} from '../../model';
import Memory from '@orbit/memory';
import { getSerializer } from '../../serializers/JSONAPISerializerCustom';
import { QueryBuilder, Record, TransformBuilder } from '@orbit/data';
import {
  related,
  remoteId,
  getMediaEaf,
  remoteIdGuid,
  getBurritoMeta,
  scriptureFullPath,
  IBurritoMeta,
  IExportArtifacts,
  IExportScripturePath,
  mediaArtifacts,
  fileInfo,
  updateableFiles,
  staticFiles,
  nameFromRef,
  VernacularTag,
} from '../../crud';
import {
  dataPath,
  cleanFileName,
  currentDateTime,
  PathType,
  createFolder,
  createPathFolder,
} from '../../utils';
import IndexedDBSource from '@orbit/indexeddb';
import IntellectualProperty from '../../model/intellectualProperty';
const ipc = (window as any)?.electron;

export async function electronExport(
  exportType: ExportType,
  artifactType: string | null | undefined,
  memory: Memory,
  backup: IndexedDBSource | undefined,
  projectid: number | string,
  userid: number | string,
  nodatamsg: string,
  localizedArtifact: string,
  getOfflineProject: (plan: Plan | VProject | string) => OfflineProject,
  target?: string,
  orgWorkflowSteps?: OrgWorkflowStep[]
): Promise<FileResponse | null> {
  const onlineSerlzr = getSerializer(memory, false);
  const offlineSrlzr = getSerializer(memory, true);
  const scripturePackage = [ExportType.DBL, ExportType.BURRITO].includes(
    exportType
  );
  const BuildFileResponse = (
    fullpath: string,
    fileName: string,
    buffer: Buffer | undefined,
    changedRecs: number
  ): FileResponse => {
    return {
      message: fileName,
      fileURL: 'file:////' + fullpath,
      contentType: 'application/' + exportType,
      buffer: buffer,
      changes: changedRecs,
      id: '1',
    };
  };

  const idStr = (kind: string, id: number | string) =>
    typeof id === 'number'
      ? id.toString()
      : remoteId(kind, id, memory.keyMap) || id.split('-')[0];

  const fileName = (
    projRec: Project,
    localizedArtifactType: string,
    ext: string
  ) =>
    'APM' +
    idStr('user', userid) +
    '_' +
    idStr('project', projRec.id) +
    '_' +
    cleanFileName(projRec.attributes.name + localizedArtifactType) +
    '.' +
    ext;

  const itfb_fileName = (projRec: Project) =>
    new Date().getDate().toString() +
    new Date().getHours().toString() +
    '_' +
    fileName(projRec, '', 'itf');

  const backupName = 'APM' + idStr('user', userid) + '_backup.' + exportType;

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
  const createZip = async (
    zip: AdmZip,
    projRec: Project,
    expType: ExportType
  ) => {
    const AddCheckEntry = async (): Promise<string> => {
      var dt = currentDateTime();
      await ipc?.zipAddFile(
        zip,
        'SILTranscriberOffline',
        dt,
        'Check Format and Date'
      );
      return dt;
    };

    const AddSourceEntry = async (dt: string): Promise<string> => {
      await ipc?.zipAddFile(zip, 'SILTranscriber', dt, 'Imported Date');
      return dt;
    };
    const AddVersionEntry = async (ver: string): Promise<string> => {
      await ipc?.zipAddFile(zip, 'Version', ver, 'IndexedDB Version');
      return ver;
    };
    const AddOfflineEntry = async (): Promise<void> => {
      await ipc?.zipAddFile(zip, 'Offline', '', 'Present if Offline project');
    };
    const AddJsonEntry = async (
      table: string,
      recs: Record[],
      sort: string
    ) => {
      //put in the remoteIds for everything, then stringify
      const ser = projRec?.keys?.remoteId ? onlineSerlzr : offlineSrlzr;
      let json = ![ExportType.AUDIO, ExportType.ELAN].includes(expType)
        ? '{"data":' + JSON.stringify(ser.serializeRecords(recs)) + '}'
        : JSON.stringify(ser.serializeRecords(recs), null, 2);
      await ipc?.zipAddJson(
        zip,
        'data/' + sort + '_' + table + '.json',
        JSON.stringify(json),
        table
      );
    };
    const AddStreamEntry = async (local: string, name: string) => {
      if (await ipc?.exists(local)) {
        await ipc?.zipAddLocal(
          zip,
          local,
          path.dirname(name),
          path.basename(name)
        );
        return true;
      } else return false;
    };
    const AddUserAvatars = async (recs: Record[]) => {
      const avatarpath = PathType.AVATARS + '/';
      for (const u of recs) {
        var user = u as User;
        if (
          user?.attributes?.avatarUrl &&
          user.attributes.avatarUrl !== null &&
          user.attributes.avatarUrl !== ''
        ) {
          var dp = dataPath(user.attributes.avatarUrl, PathType.AVATARS, {
            localname:
              remoteId('user', user.id, memory.keyMap) +
              user.attributes.familyName +
              '.png',
          });
          await AddStreamEntry(dp, avatarpath + path.basename(dp));
        }
      }
    };
    const AddOrgLogos = async (recs: Record[]) => {
      const logopath = PathType.LOGOS + '/';
      for (const o of recs) {
        var org = o as Organization;
        if (
          org?.attributes?.logoUrl &&
          org.attributes.logoUrl !== null &&
          org.attributes.logoUrl !== ''
        ) {
          var dp = dataPath(org.attributes.logoUrl, PathType.LOGOS, {
            localname: org.attributes.slug + '.png',
          });
          await AddStreamEntry(dp, logopath + path.basename(dp));
        }
      }
    };

    const AddMediaFiles = async (recs: Record[], rename: boolean) => {
      const mediapath = PathType.MEDIA + '/';
      var newname = '';
      for (const m of recs) {
        var mf = m as MediaFile;
        if (!mf.attributes) return;
        const mp = dataPath(mf.attributes.audioUrl, PathType.MEDIA);
        const { fullPath } = scriptureFullPath(mf, {
          memory,
          scripturePackage,
          projRec,
        } as IExportScripturePath);
        if (rename) newname = mediapath + nameFromRef(mf, memory);
        else newname = fullPath || mediapath + path.basename(mp);
        await AddStreamEntry(mp, newname);
        if (expType === ExportType.ELAN) {
          const eafCode = getMediaEaf(mf, memory);
          const name = path.basename(newname, path.extname(newname)) + '.eaf';
          await ipc?.zipAddFile(zip, mediapath + name, eafCode, 'EAF');
        }
      }
    };

    const AddFonts = async () => {
      const dir = dataPath(PathType.FONTS);
      await createFolder(dir);
      var items = await ipc?.readDir(dir);
      for (var i = 0; i < items.length; i++) {
        var fontfile = path.join(dir, items[i]);
        if (await ipc?.exists(fontfile))
          await ipc?.zipAddLocal(zip, fontfile, PathType.FONTS, items[i]);
      }
    };
    const GroupMemberships = (project: Project) => {
      var groupid = related(project, 'group');
      return memory.cache.query((q: QueryBuilder) =>
        q.findRecords('groupmembership').filter({
          relation: 'group',
          record: { type: 'group', id: groupid },
        })
      ) as GroupMembership[];
    };

    const Plans = (project: Project) =>
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('plan').filter({
          relation: 'project',
          record: { type: 'project', id: project.id },
        })
      ) as Plan[];

    const Sections = (project: Project) => {
      //can't get this to work...
      //var plans = Plans(project).map((pl) => {
      //  return { type: 'plan', id: pl.id };
      //});
      //var sections = memory.cache.query((q: QueryBuilder) =>
      //  q.findRecords('section').filter({ relation: 'plan', records: plans })
      //) as Section[];
      var plans = Plans(project).map((pl) => pl.id);
      var allsections = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('section')
      ) as Section[];
      return allsections.filter((s) => plans.includes(related(s, 'plan')));
    };

    const Passages = (project: Project) => {
      var sections = Sections(project).map((s) => s.id);
      var passages = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('passage')
      ) as Passage[];
      return passages.filter((p) => sections.includes(related(p, 'section')));
    };

    const FromPassages = (
      table: string,
      project: Project | undefined,
      remoteIds: boolean
    ) => {
      //passagestatechange or mediafile
      var recs = memory.cache.query((q: QueryBuilder) =>
        q.findRecords(table)
      ) as Record[];
      if (project) {
        var passages = Passages(project).map((p) => p.id);
        recs = recs.filter((rec) => passages.includes(related(rec, 'passage')));
      }
      if (remoteIds) {
        recs.forEach((r) => {
          if (!remoteId(table, r.id, memory.keyMap) && r.attributes)
            r.attributes.offlineId = r.id;
          if (
            table === 'mediafile' &&
            !remoteId('mediafile', related(r, 'sourceMedia'), memory.keyMap)
          ) {
            (r as MediaFile).attributes.sourceMediaOfflineId = related(
              r,
              'sourceMedia'
            );
          }
        });
      }
      return recs;
    };
    const Discussions = (project: Project | undefined, remoteIds: boolean) => {
      var ds = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('discussion')
      ) as Discussion[];
      if (project) {
        var mediafiles = FromPassages('mediafile', project, remoteIds).map(
          (m) => m.id
        );
        ds = ds.filter((rec) => mediafiles.includes(related(rec, 'mediafile')));
      }
      if (remoteIds) {
        ds.forEach((d) => {
          if (!remoteId('discussion', d.id, memory.keyMap) && d.attributes)
            d.attributes.offlineId = d.id;
          if (!remoteId('mediafile', related(d, 'mediafile'), memory.keyMap))
            d.attributes.offlineMediafileId = related(d, 'mediafile');
        });
      }
      return ds;
    };
    const OrgKeyTerms = (remoteIds: boolean) => {
      var kts = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('orgkeyterm')
      ) as OrgKeyterm[];

      if (remoteIds) {
        kts.forEach((kt) => {
          if (!remoteId('orgkeyterm', kt.id, memory.keyMap) && kt.attributes)
            kt.attributes.offlineid = kt.id;
        });
      }
      return kts;
    };

    const OrgKeyTermTargets = (remoteIds: boolean) => {
      var ktts = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('orgkeytermtarget')
      ) as OrgKeytermTarget[];

      if (remoteIds) {
        ktts.forEach((ktt) => {
          if (
            !remoteId('orgkeytermtarget', ktt.id, memory.keyMap) &&
            ktt.attributes
          )
            ktt.attributes.offlineId = ktt.id;
          if (
            related(ktt, 'mediafile') &&
            !remoteId('mediafile', related(ktt, 'mediafile'), memory.keyMap)
          )
            ktt.attributes.offlineMediafileId = related(ktt, 'mediafile');
        });
      }
      return ktts;
    };
    const IntellectualProperties = (
      project: Project | undefined,
      remoteIds: boolean
    ) => {
      var ips = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('intellectualproperty')
      ) as IntellectualProperty[];
      if (project) {
        ips = ips.filter(
          (rec) =>
            related(rec, 'organization') === related(project, 'organization')
        );
      }
      if (remoteIds) {
        ips.forEach((ip) => {
          if (!remoteId('intellectualproperty', ip.id, memory.keyMap))
            ip.attributes.offlineId = ip.id;
          if (
            !remoteId(
              'mediafile',
              related(ip, 'releaseMediafile'),
              memory.keyMap
            )
          )
            ip.attributes.offlineMediafileId = related(ip, 'releaseMediafile');
        });
      }
      return ips;
    };

    const FromMedia = (media: MediaFile[], remoteIds: boolean) => {
      if (remoteIds) {
        media.forEach((m) => {
          if (!remoteId('mediafile', m.id, memory.keyMap) && m.attributes) {
            m.attributes.offlineId = m.id;
          }
          var src = related(m, 'sourceMedia');
          if (
            src &&
            !remoteId('mediafile', src, memory.keyMap) &&
            m.attributes
          ) {
            m.attributes.sourceMediaOfflineId = src;
          }
        });
      }
      return media;
    };
    const Comments = (project: Project | undefined, remoteIds: boolean) => {
      var comments = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('comment')
      ) as Record[];
      if (project) {
        var discussions = Discussions(project, remoteIds);
        var discussionIds = discussions.map((d) => d.id);
        comments = comments.filter((rec) =>
          discussionIds.includes(related(rec, 'discussion'))
        );
      }
      if (remoteIds) {
        comments.forEach((c) => {
          if (!remoteId('comment', c.id, memory.keyMap) && c.attributes) {
            c.attributes.offlineId = c.id;
            c.attributes.offlineDiscussionId = related(c, 'discussion');
          }
          if (
            !remoteId('mediafile', related(c, 'mediafile'), memory.keyMap) &&
            c.attributes
          ) {
            c.attributes.offlineMediafileId = related(c, 'mediafile');
          }
        });
      }
      return comments;
    };

    const GetTableRecs = (
      info: fileInfo,
      project: Project | undefined,
      needsRemoteIds: boolean
    ): Record[] => {
      const defaultQuery = (table: string) => {
        return (
          memory.cache.query((q: QueryBuilder) =>
            q.findRecords(table)
          ) as Record[]
        ).filter((r) => Boolean(r?.keys?.remoteId) === needsRemoteIds);
      };
      switch (info.table) {
        case 'organization':
          if (project)
            return [
              memory.cache.query((q: QueryBuilder) =>
                q.findRecord({
                  type: 'organization',
                  id: related(project, 'organization'),
                })
              ) as Organization,
            ];
          return defaultQuery(info.table);

        case 'project':
          if (project) return [project];
          return defaultQuery(info.table);

        case 'group':
          if (project)
            return [
              memory.cache.query((q: QueryBuilder) =>
                q.findRecord({ type: 'group', id: related(project, 'group') })
              ) as Group,
            ];
          return defaultQuery(info.table);

        case 'groupmembership':
          if (project) return GroupMemberships(project);
          return defaultQuery(info.table);

        case 'user':
          if (project) {
            var projusers = GroupMemberships(project).map((gm) =>
              related(gm, 'user')
            );
            var users = memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table)
            ) as User[];

            return users.filter(
              (u) => projusers.find((p) => p === u.id) !== undefined
            );
          }
          return defaultQuery(info.table);

        case 'plan':
          if (project) return Plans(project);
          return defaultQuery(info.table);

        case 'section':
          if (project) return Sections(project);
          return defaultQuery(info.table);

        case 'passage':
          if (project) return Passages(project);
          return defaultQuery(info.table);

        case 'mediafile':
        case 'passagestatechange':
          if (artifactType !== undefined) {
            const media = mediaArtifacts({
              memory,
              projRec,
              artifactType,
              target,
              orgWorkflowSteps,
            } as IExportArtifacts);
            if (media) return FromMedia(media, needsRemoteIds);
          }
          var tmp = FromPassages(info.table, project, needsRemoteIds);
          if (info.table === 'mediafile') {
            //get IP media
            var ip = IntellectualProperties(project, needsRemoteIds).map((i) =>
              related(i, 'releaseMediafile')
            );
            var media = memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table)
            ) as MediaFile[];
            var ipmedia = media.filter((m) => ip.includes(m.id));
            return tmp.concat(FromMedia(ipmedia, needsRemoteIds));
          }
          return tmp;

        case 'discussion':
          return Discussions(project, needsRemoteIds);

        case 'comment':
          return Comments(project, needsRemoteIds);

        case 'projectintegration':
          if (project)
            return memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table).filter({
                relation: 'project',
                record: { type: 'project', id: project.id },
              })
            ) as Record[];
          return defaultQuery(info.table);

        case 'intellectualproperty':
          return IntellectualProperties(project, needsRemoteIds);

        case 'orgkeyterm':
          return OrgKeyTerms(needsRemoteIds);

        case 'orgkeytermtarget':
          return OrgKeyTermTargets(needsRemoteIds);
        default:
          //activitystate,integration,plantype,projecttype,role
          return defaultQuery(info.table);
      }
    };
    const AddChanged = async (
      info: fileInfo,
      project: Project | undefined,
      needsRemoteIds: boolean
    ) => {
      var recs = GetTableRecs(info, project, needsRemoteIds);
      var changed = recs;
      if (recs && Array.isArray(recs) && recs.length > 0) {
        changed = recs.filter(
          (u) => u.attributes && moment.utc(u.attributes.dateUpdated) > imported
        );
        await AddJsonEntry(
          info.table + 's',
          info.table === 'project' ? recs : changed,
          info.sort
        );

        switch (info.table) {
          case 'user':
            await AddUserAvatars(changed);
            break;
          case 'mediafile':
            var newOnly = changed.filter(
              (m) =>
                m.attributes && moment.utc(m.attributes.dateCreated) > imported
            );
            await AddMediaFiles(newOnly, false);
        }
        return changed.length;
      }
      return 0;
    };

    const AddAll = async (
      info: fileInfo,
      project: Project | undefined,
      needsRemoteIds: boolean,
      excludeNew: boolean = false,
      checkRename: boolean = false
    ) => {
      let recs = GetTableRecs(info, project, needsRemoteIds);
      let len = recs?.length || 0;
      let ret = { Added: len, Filtered: 0 };
      if (len > 0) {
        if (needsRemoteIds && excludeNew) {
          recs = recs.filter((r) => Boolean(r.keys?.remoteId));
          ret.Added = recs?.length || 0;
          ret.Filtered = len - ret.Added;
        }
        if (!scripturePackage) {
          AddJsonEntry(info.table + 's', recs, info.sort);
        }
        switch (info.table) {
          case 'organization':
            await AddOrgLogos(recs);
            break;
          case 'user':
            await AddUserAvatars(recs);
            break;
          case 'mediafile':
            await AddMediaFiles(
              recs,
              checkRename &&
                recs.length > 0 &&
                related(recs[0], 'artifactType') === VernacularTag
            );
        }
      }
      return ret;
    };

    const onlyOneProject = (): boolean => {
      var p = memory.cache.query((q: QueryBuilder) => q.findRecords('project'));
      if (p && Array.isArray(p)) return p.length === 1;
      return true; //should never get here
    };

    const op = getOfflineProject(projRec.id);
    const imported = moment.utc(op.attributes.snapshotDate || '01/01/1900');
    if (!scripturePackage) {
      await AddSourceEntry(imported.toISOString());
      await AddVersionEntry((backup?.schema.version || 1).toString());
    } else if (expType === ExportType.BURRITO) {
      const userId =
        remoteIdGuid('user', userid.toString(), memory.keyMap) ||
        userid.toString();
      const burritoMetaStr = getBurritoMeta({
        memory,
        userId,
        projRec,
        scripturePackage,
        artifactType,
        target,
        orgWorkflowSteps,
      } as IBurritoMeta);
      await ipc?.zipAddFile(zip, 'metadata.json', burritoMetaStr, 'metadata');
    }
    var needsRemoteIds = Boolean(projRec?.keys?.remoteId);
    if (!needsRemoteIds) await AddOfflineEntry();
    const limit = onlyOneProject() ? undefined : projRec;
    var numRecs = 0;
    var numFiltered = 0;
    switch (expType) {
      case ExportType.ITF:
      case ExportType.ITFBACKUP:
      case ExportType.ITFSYNC:
        const exported = await AddCheckEntry();
        for (const info of updateableFiles) {
          numRecs += await AddChanged(info, limit, needsRemoteIds);
        }
        if (expType !== ExportType.ITFBACKUP && backup && op.attributes) {
          op.attributes.exportedDate = exported;
          await backup.push((t: TransformBuilder) => t.updateRecord(op));
        }
        break;
      case ExportType.DBL:
      case ExportType.BURRITO:
      case ExportType.AUDIO:
      case ExportType.ELAN:
        numRecs += (
          await AddAll(
            { table: 'mediafile', sort: 'H' },
            limit,
            needsRemoteIds,
            false,
            [ExportType.AUDIO, ExportType.ELAN].includes(expType)
          )
        ).Added;
        break;
      default:
        for (const info of updateableFiles) {
          var result = await AddAll(info, limit, needsRemoteIds, true);
          numRecs += result.Added;
          numFiltered += result.Filtered;
        }
        for (const info of staticFiles) {
          await AddAll(info, limit, needsRemoteIds);
        }
        await AddFonts();
    }
    return { zip, numRecs, numFiltered };
  };

  var projects: Project[];
  var backupZip: AdmZip | undefined;
  if (
    exportType === ExportType.FULLBACKUP ||
    exportType === ExportType.ITFSYNC
  ) {
    //avoid intermittent errors where projecttype or plan is null
    if (backup) {
      await memory.sync(await backup.pull((q) => q.findRecords('project')));
      await memory.sync(await backup.pull((q) => q.findRecords('mediafile')));
    }

    projects = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('project')
    ) as Project[];

    var offlineprojects = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('offlineproject')
    ) as OfflineProject[];
    var ids = offlineprojects
      .filter((o) => o.attributes.offlineAvailable)
      .map((o) => related(o, 'project')) as string[];
    projects = projects.filter((p) => ids.includes(p.id));
    backupZip = (await ipc?.zipOpen()) as AdmZip;
    if (exportType === ExportType.FULLBACKUP) {
      exportType = ExportType.PTF;
    } else {
      projects = projects.filter(
        (p) => remoteId('project', p.id, memory.keyMap) !== undefined
      );
      exportType = ExportType.ITF;
    }
  } else {
    projects = [getProjRec(projectid)];
  }
  var changedRecs = 0;
  for (var ix: number = 0; ix < projects.length; ix++) {
    let { zip, numRecs, numFiltered } = await createZip(
      (await ipc?.zipOpen()) as AdmZip,
      projects[ix],
      exportType
    );
    const filename =
      exportType === ExportType.ITFBACKUP
        ? itfb_fileName(projects[ix])
        : [ExportType.AUDIO, ExportType.BURRITO, ExportType.ELAN].includes(
            exportType
          )
        ? fileName(projects[ix], `${localizedArtifact}_${exportType}`, 'zip')
        : fileName(projects[ix], localizedArtifact, exportType);
    changedRecs += numRecs;
    if (backupZip) {
      if (numRecs)
        await ipc?.zipAddZip(
          backupZip,
          filename,
          zip,
          projects[ix].attributes.name
        );
      if (numFiltered) {
        const itf = await createZip(
          (await ipc?.zipOpen()) as AdmZip,
          projects[ix],
          ExportType.ITF
        );
        await ipc?.zipAddZip(
          backupZip,
          fileName(projects[ix], localizedArtifact, ExportType.ITF),
          itf.zip,
          projects[ix].attributes.name
        );
      }
    } else {
      if (numRecs) {
        var where = dataPath(filename);
        await createPathFolder(where);
        await ipc?.zipWrite(zip, where);
        return BuildFileResponse(where, filename, undefined, numFiltered);
      } else if (nodatamsg && projects.length === 1) throw new Error(nodatamsg);
    }
  }
  var backupWhere = dataPath(backupName);
  await createPathFolder(backupWhere);
  if (backupZip) await ipc?.zipWrite(backupZip, backupWhere);
  const buffer =
    exportType === ExportType.ITF
      ? await ipc?.zipToBuffer(backupZip)
      : undefined;
  await ipc?.zipClose(backupZip);
  return BuildFileResponse(
    backupWhere,
    backupName,
    buffer,
    backupZip ? 0 : changedRecs
  );
}
