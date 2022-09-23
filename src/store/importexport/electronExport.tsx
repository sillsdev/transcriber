import { ExportType, FileResponse } from './types';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
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
} from '../../crud';
import {
  dataPath,
  cleanFileName,
  currentDateTime,
  PathType,
  createFolder,
} from '../../utils';
import IndexedDBSource from '@orbit/indexeddb';
import IntellectualProperty from '../../model/intellectualProperty';

export async function electronExport(
  exportType: ExportType,
  artifactType: string | null | undefined,
  memory: Memory,
  backup: IndexedDBSource | undefined,
  projectid: number | string,
  fingerprint: string,
  userid: number | string,
  nodatamsg: string,
  noNewallowed: string,
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
    'Transcriber' +
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

  const backupName =
    'Transcriber' + idStr('user', userid) + '_backup.' + exportType;

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
    fingerprint: string
  ) => {
    const AddCheckEntry = (): string => {
      var dt = currentDateTime();
      zip.addFile(
        'SILTranscriberOffline',
        Buffer.alloc(dt.length, dt),
        'Check Format and Date'
      );
      return dt;
    };

    const AddSourceEntry = (dt: string): string => {
      zip.addFile(
        'SILTranscriber',
        Buffer.alloc(dt.length, dt),
        'Imported Date'
      );
      return dt;
    };
    const AddVersionEntry = (ver: string): string => {
      zip.addFile(
        'Version',
        Buffer.alloc(ver.length, ver),
        'IndexedDB Version'
      );
      return ver;
    };
    const AddOfflineEntry = (): void => {
      zip.addFile('Offline', Buffer.alloc(0, ''), 'Present if Offline project');
    };
    const AddJsonEntry = (table: string, recs: Record[], sort: string) => {
      //put in the remoteIds for everything, then stringify
      const ser = projRec?.keys?.remoteId ? onlineSerlzr : offlineSrlzr;
      let json =
        exportType !== ExportType.AUDIO
          ? '{"data":' + JSON.stringify(ser.serializeRecords(recs)) + '}'
          : JSON.stringify(ser.serializeRecords(recs), null, 2);
      zip.addFile(
        'data/' + sort + '_' + table + '.json',
        Buffer.from(json),
        table
      );
    };
    const AddStreamEntry = (local: string, name: string) => {
      if (fs.existsSync(local)) {
        zip.addLocalFile(local, path.dirname(name), path.basename(name));
        return true;
      } else return false;
    };
    const AddUserAvatars = (recs: Record[]) => {
      const avatarpath = PathType.AVATARS + '/';
      recs.forEach((u) => {
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
          AddStreamEntry(dp, avatarpath + path.basename(dp));
        }
      });
    };
    const AddOrgLogos = (recs: Record[]) => {
      const logopath = PathType.LOGOS + '/';
      recs.forEach((o) => {
        var org = o as Organization;
        if (
          org?.attributes?.logoUrl &&
          org.attributes.logoUrl !== null &&
          org.attributes.logoUrl !== ''
        ) {
          var dp = dataPath(org.attributes.logoUrl, PathType.LOGOS, {
            localname: org.attributes.slug + '.png',
          });
          AddStreamEntry(dp, logopath + path.basename(dp));
        }
      });
    };

    const AddMediaFiles = (recs: Record[]) => {
      const mediapath = PathType.MEDIA + '/';
      recs.forEach((m) => {
        var mf = m as MediaFile;
        if (!mf.attributes) return;
        const mp = dataPath(mf.attributes.audioUrl, PathType.MEDIA);
        const { fullPath } = scriptureFullPath(mf, {
          memory,
          scripturePackage,
          projRec,
        } as IExportScripturePath);
        AddStreamEntry(mp, fullPath || mediapath + path.basename(mp));
        if (!scripturePackage) {
          const eafCode = getMediaEaf(mf, memory);
          const name = path.basename(mp, path.extname(mp)) + '.eaf';
          zip.addFile(
            mediapath + name,
            Buffer.alloc(eafCode.length, eafCode),
            'EAF'
          );
        }
      });
    };

    const AddFonts = () => {
      const dir = dataPath(PathType.FONTS);
      createFolder(dir);
      var items = fs.readdirSync(dir);
      for (var i = 0; i < items.length; i++) {
        var fontfile = path.join(dir, items[i]);
        if (fs.existsSync(fontfile))
          zip.addLocalFile(fontfile, PathType.FONTS, items[i]);
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
          return FromPassages(info.table, project, needsRemoteIds);

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

        default:
          //activitystate,integration,plantype,projecttype,role
          return (
            memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table)
            ) as Record[]
          ).filter((r) => Boolean(r?.keys?.remoteId) === needsRemoteIds);
      }
    };
    const AddChanged = (
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
        AddJsonEntry(
          info.table + 's',
          info.table === 'project' ? recs : changed,
          info.sort
        );

        switch (info.table) {
          case 'user':
            AddUserAvatars(changed);
            break;
          case 'mediafile':
            var newOnly = changed.filter(
              (m) =>
                m.attributes && moment.utc(m.attributes.dateCreated) > imported
            );
            AddMediaFiles(newOnly);
        }
        return changed.length;
      }
      return 0;
    };

    const AddAll = (
      info: fileInfo,
      project: Project | undefined,
      needsRemoteIds: boolean,
      allowNew: boolean = true
    ) => {
      let recs = GetTableRecs(info, project, needsRemoteIds);
      if (recs && Array.isArray(recs) && recs.length > 0) {
        if (
          needsRemoteIds &&
          !allowNew &&
          recs.filter((r) => !Boolean(r.keys?.remoteId)).length > 0
        ) {
          throw new Error(noNewallowed);
        }
        if (!scripturePackage) {
          AddJsonEntry(info.table + 's', recs, info.sort);
        }
        switch (info.table) {
          case 'organization':
            AddOrgLogos(recs);
            break;
          case 'user':
            AddUserAvatars(recs);
            break;
          case 'mediafile':
            AddMediaFiles(recs);
        }
      }
      return recs?.length || 0;
    };

    const onlyOneProject = (): boolean => {
      var p = memory.cache.query((q: QueryBuilder) => q.findRecords('project'));
      if (p && Array.isArray(p)) return p.length === 1;
      return true; //should never get here
    };

    const op = getOfflineProject(projRec.id);
    const imported = moment.utc(op.attributes.snapshotDate || '01/01/1900');
    if (!scripturePackage) {
      AddSourceEntry(imported.toISOString());
      AddVersionEntry((backup?.schema.version || 1).toString());
    } else if (exportType === ExportType.BURRITO) {
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
      zip.addFile(
        'metadata.json',
        Buffer.alloc(burritoMetaStr.length, burritoMetaStr),
        'metadata'
      );
    }
    var needsRemoteIds = Boolean(projRec?.keys?.remoteId);
    if (!needsRemoteIds) AddOfflineEntry();
    const limit = onlyOneProject() ? undefined : projRec;
    var numRecs = 0;
    switch (exportType) {
      case ExportType.ITF:
      case ExportType.ITFBACKUP:
      case ExportType.ITFSYNC:
        const exported = AddCheckEntry();
        updateableFiles.forEach(
          (info) => (numRecs += AddChanged(info, limit, needsRemoteIds))
        );
        if (exportType !== ExportType.ITFBACKUP && backup && op.attributes) {
          op.attributes.exportedDate = exported;
          await backup.push((t: TransformBuilder) => t.updateRecord(op));
        }
        break;
      case ExportType.DBL:
      case ExportType.BURRITO:
      case ExportType.AUDIO:
        numRecs += AddAll(
          { table: 'mediafile', sort: 'H' },
          limit,
          needsRemoteIds
        );
        break;
      default:
        updateableFiles.forEach(
          (info) => (numRecs += AddAll(info, limit, needsRemoteIds, false))
        );
        staticFiles.forEach((info) => AddAll(info, limit, needsRemoteIds));
        AddFonts();
    }
    return { zip, numRecs };
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
    backupZip = new AdmZip();
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
    const { zip, numRecs } = await createZip(
      new AdmZip(),
      projects[ix],
      fingerprint
    );
    const filename =
      exportType === ExportType.ITFBACKUP
        ? itfb_fileName(projects[ix])
        : fileName(projects[ix], localizedArtifact, exportType);
    changedRecs += numRecs;
    if (backupZip) {
      if (numRecs)
        backupZip.addFile(
          filename,
          zip.toBuffer(),
          projects[ix].attributes.name
        );
    } else {
      if (numRecs) {
        var where = dataPath(filename);
        zip.writeZip(where);
        return BuildFileResponse(where, filename, undefined, changedRecs);
      } else if (nodatamsg && projects.length === 1) throw new Error(nodatamsg);
    }
  }
  var backupWhere = dataPath(backupName);
  if (backupZip) backupZip.writeZip(backupWhere);
  return BuildFileResponse(
    backupWhere,
    backupName,
    exportType === ExportType.ITF ? backupZip?.toBuffer() : undefined,
    changedRecs
  );
}
