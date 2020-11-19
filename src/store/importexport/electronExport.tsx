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
} from '../../model';
import Memory from '@orbit/memory';
import { JSONAPISerializerCustom } from '../../serializers/JSONAPISerializerCustom';
import {
  QueryBuilder,
  RecordIdentity,
  Record,
  TransformBuilder,
} from '@orbit/data';
import {  related, remoteId, getMediaEaf, remoteIdGuid } from '../../crud';
import { dataPath, cleanFileName, currentDateTime, PathType} from '../../utils';
import IndexedDBSource from '@orbit/indexeddb';

export async function electronExport(
  exportType: ExportType,
  memory: Memory,
  backup: IndexedDBSource | undefined,
  projectid: number,
  fingerprint: string,
  userid: number,
  ser: JSONAPISerializerCustom,
  getOfflineProject: (plan: Plan | VProject | string) => OfflineProject,
): Promise<FileResponse | null> {

  const BuildFileResponse = (
    fullpath: string,
    fileName: string,
    buffer: Buffer | undefined,
    changedRecs: number
  ): FileResponse => {
    return {
      data: {
        attributes: {
          message: fileName,
          fileurl: 'file:////' + fullpath,
          contenttype: 'application/' + exportType,
          buffer: buffer,
          changes: changedRecs,
        },
        type: 'file-responses',
        id: '1',
      },
    };
  };

  const fileName = (projRec: Project, ext: string) =>
    'Transcriber' +
    userid +
    '_' +
    remoteId('project', projRec.id, memory.keyMap) +
    '_' +
    cleanFileName(projRec.attributes.name) +
    '.' +
    ext;

  const itfb_fileName = (projRec: Project) =>
    new Date().getDate().toString() +
    new Date().getHours().toString() +
    '_' +
    fileName(projRec, 'itf');

  const backupName = 'Transcriber' + userid + '_backup.' + exportType;

  const getProjRec = (projectid: string): Project => {
    return memory.cache.query((q: QueryBuilder) =>
      q.findRecord({
        type: 'project',
        id: remoteIdGuid('project', projectid, memory.keyMap),
      })
    ) as Project;
  };
  const createZip = async (zip: AdmZip, projRec: Project, fingerprint: string) => {
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
    const AddJsonEntry = (table: string, recs: Record[], sort: string) => {
      //put in the remoteIds for everything, then stringify
      var json = '{"data":' + JSON.stringify(ser.serializeRecords(recs)) + '}';
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
          user.attributes &&
          user.attributes.avatarUrl !== null &&
          user.attributes.avatarUrl !== ''
        ) {
          var dp = dataPath(user.attributes.avatarUrl, PathType.AVATARS, remoteId('user', user.id, memory.keyMap) + user.attributes.familyName+".png" );
          AddStreamEntry(
           dp,
           avatarpath + path.basename(dp)
          );
        }
      });
    };
    const AddOrgLogos = (recs: Record[]) => {
      const logopath = PathType.LOGOS + '/';
      recs.forEach((o) => {
        var org = o as Organization;
        if (
          org.attributes &&
          org.attributes.logoUrl !== null &&
          org.attributes.logoUrl !== ''
        ) {
          var dp = dataPath(org.attributes.logoUrl, PathType.LOGOS, org.attributes.slug + ".png");
          AddStreamEntry(
            dp,
            logopath + path.basename(dp)
          );}
      });
    };
    const AddMediaFiles = (recs: Record[]) => {
      const mediapath = PathType.MEDIA + '/';
      recs.forEach((m) => {
        var mf = m as MediaFile;
        if (!mf.attributes)
          return;
        const mp = dataPath(mf.attributes.audioUrl, PathType.MEDIA);
        AddStreamEntry(
            mp,
            mediapath + path.basename(mp)
          );
        const eafCode = getMediaEaf(mf, memory);
        const name =
          path.basename(mp,
                      path.extname(mp)
          ) + '.eaf';
        zip.addFile(
          mediapath + name,
          Buffer.alloc(eafCode.length, eafCode),
          'EAF'
        );
      });
    };

    const AddFonts = () => {
      const dir = dataPath('fonts');
      var items = fs.readdirSync(dir);
      for (var i = 0; i < items.length; i++) {
        var fontfile = path.join(dir, items[i])
        if (fs.existsSync(fontfile))
          zip.addLocalFile(fontfile, 'fonts', items[i]);
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

    const GetTableRecs = (
      info: fileInfo,
      project: Project | undefined
    ): Record[] => {
      if (project) {
        switch (info.table) {
          case 'project':
            return [project];

          case 'group':
            return [
              memory.cache.query((q: QueryBuilder) =>
                q.findRecord({ type: 'group', id: related(project, 'group') })
              ) as Group,
            ];

          case 'groupmembership':
            return GroupMemberships(project);

          case 'user':
            var gms = GroupMemberships(project).map((gm) => gm.id);
            var users = memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table)
            ) as User[];
            return users.filter(
              (u) =>
                related(u, 'groupMemberships') &&
                gms.some(
                  (gm) =>
                    related(u, 'groupMemberships')
                      .map((ri: RecordIdentity) => ri.id)
                      .indexOf(gm) >= 0
                )
            );

          case 'plan':
            return Plans(project);

          case 'section':
            return Sections(project);

          case 'passage':
            return Passages(project);

          case 'mediafile':
          case 'passagestatechange':
            var passages = Passages(project).map((p) => p.id);
            var recs = memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table)
            ) as Record[];
            return recs.filter((rec) =>
              passages.includes(related(rec, 'passage'))
            );

          case 'projectintegration':
            return memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table).filter({
                relation: 'project',
                record: { type: 'project', id: project.id },
              })
            ) as Record[];

          default:
            //activitystate,integration,plantype,projecttype,role
            return memory.cache.query((q: QueryBuilder) =>
              q.findRecords(info.table)
            ) as Record[];
        }
      } else {
        return memory.cache.query((q: QueryBuilder) =>
          q.findRecords(info.table)
        ) as Record[];
      }
    };
    const AddChanged = (info: fileInfo, project: Project | undefined) => {
      var recs = GetTableRecs(info, project);
      var changed = recs;
      if (recs && Array.isArray(recs) && recs.length > 0) {
        if (info.table !== 'project')
          changed = recs.filter(
            (u) =>
              u.attributes && moment.utc(u.attributes.dateUpdated) > imported
          );

        AddJsonEntry(info.table + 's', changed, info.sort);

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

    const AddAll = (info: fileInfo, project: Project | undefined) => {
      var recs = GetTableRecs(info, project);
      if (recs && Array.isArray(recs) && recs.length > 0) {
        AddJsonEntry(info.table + 's', recs, info.sort);
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
    };

    const onlyOneProject = (): boolean => {
      var p = memory.cache.query((q: QueryBuilder) => q.findRecords('project'));
      if (p && Array.isArray(p)) return p.length === 1;
      return true; //should never get here
    };

    interface fileInfo {
      table: string;
      sort: string;
    }
    const updateableFiles = [
      { table: 'project', sort: 'D' },
      { table: 'user', sort: 'A' },
      { table: 'groupmembership', sort: 'D' },
      { table: 'section', sort: 'F' },
      { table: 'passage', sort: 'G' },
      { table: 'mediafile', sort: 'H' },
      { table: 'passagestatechange', sort: 'H' },
    ];
    /* If these can change in electron, they must extend BaseModel instead of Record,
        call UpdateRecord instead of t.updateRecord, and be moved up to the files array */
    const staticFiles = [
      { table: 'activitystate', sort: 'B' },
      { table: 'integration', sort: 'B' },
      { table: 'organization', sort: 'B' },
      { table: 'plantype', sort: 'B' },
      { table: 'projecttype', sort: 'B' },
      { table: 'role', sort: 'B' },
      { table: 'group', sort: 'C' },
      { table: 'organizationmembership', sort: 'C' },
      { table: 'plan', sort: 'E' },
      { table: 'projectintegration', sort: 'E' }, //do we care that they synced locally??
    ];
    const op = getOfflineProject(projRec.id);
    const imported = moment.utc(op.attributes.snapshotDate || '01/01/1900');

    AddSourceEntry(projRec.attributes.dateImported || '');
    AddVersionEntry('1'); //TODO: ask what version indexeddb is
    const limit = onlyOneProject() ? undefined : projRec;
    var numRecs = 0;
    switch (exportType)
    { case ExportType.ITF:
      case ExportType.ITFBACKUP:
      case ExportType.ITFSYNC:
        const exported = AddCheckEntry();
        updateableFiles.forEach((info) => numRecs += AddChanged(info, limit));
        if (exportType !== ExportType.ITFBACKUP && backup) {
          op.attributes.exportedDate = exported;
          await backup.push((t: TransformBuilder) => t.updateRecord(op));
        }
        break;
      default:
        updateableFiles.forEach((info) => AddAll(info, limit));
        staticFiles.forEach((info) => AddAll(info, limit));
        AddFonts();
      }
    return {zip, numRecs};
  };

  var projects: Project[];
  var backupZip: AdmZip | undefined;
  if (exportType === ExportType.FULLBACKUP || exportType === ExportType.ITFSYNC) {
    projects = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('project')
    ) as Project[];
    backupZip = new AdmZip();
    if (exportType === ExportType.FULLBACKUP)
      exportType = ExportType.PTF;
    else {
      exportType = ExportType.ITF;
      var offlineprojects = memory.cache.query((q: QueryBuilder) =>
                        q.findRecords('offlineproject')
                    ) as OfflineProject[];
      var ids = offlineprojects.filter(o => o.attributes.offlineAvailable).map(o => related(o, 'project')) as string[];
      projects = projects.filter(p => ids.includes(p.id));
    }
  } else {
    projects = [getProjRec(projectid.toString())];
  }
  var changedRecs = 0
  for (var ix: number = 0; ix < projects.length; ix++) {
    const {zip, numRecs} = await createZip(new AdmZip(), projects[ix], fingerprint);
    const filename =
      exportType === ExportType.ITFBACKUP
        ? itfb_fileName(projects[ix])
        : fileName(projects[ix], exportType);
    changedRecs += numRecs;
    if (backupZip) {
      backupZip.addFile(filename, zip.toBuffer(), projects[ix].attributes.name);
    } else {
      var where = dataPath(filename);
      zip.writeZip(where);
      return BuildFileResponse(where, filename, undefined, changedRecs);
    }
  }
  var backupWhere = dataPath(backupName);
  if (backupZip) backupZip.writeZip(backupWhere);
  return BuildFileResponse(backupWhere, backupName, exportType === ExportType.ITF ? backupZip?.toBuffer() : undefined, changedRecs);
}
