import { FileResponse } from './types';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { DataPath } from '../../utils/DataPath';
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
} from '../../model';
import {
  cleanFileName,
  remoteIdGuid,
  getMediaEaf,
  related,
  remoteId,
} from '../../utils';
import Memory from '@orbit/memory';
import { JSONAPISerializerCustom } from '../../serializers/JSONAPISerializerCustom';
import {
  QueryBuilder,
  RecordIdentity,
  Record,
  TransformBuilder,
} from '@orbit/data';
import { isArray } from 'util';
import moment from 'moment';
import { currentDateTime } from '../../utils/currentDateTime';

export async function electronExport(
  exportType: string,
  memory: Memory,
  projectid: number,
  userid: number,
  ser: JSONAPISerializerCustom
): Promise<FileResponse | null> {
  const BuildFileResponse = (
    fullpath: string,
    fileName: string
  ): FileResponse => {
    return {
      data: {
        attributes: {
          message: fileName,
          fileurl: 'file:////' + fullpath,
          contenttype: 'application/' + exportType,
        },
        type: 'file-responses',
        id: '1',
      },
    };
  };

  const fileName = (projRec: Project) =>
    'Transcriber' +
    userid +
    '_' +
    remoteId('project', projRec.id, memory.keyMap) +
    '_' +
    cleanFileName(projRec.attributes.name) +
    '.' +
    exportType;

  const backupName = 'Transcriber' + userid + '_backup.' + exportType;

  const getProjRec = (projectid: string): Project => {
    return memory.cache.query((q: QueryBuilder) =>
      q.findRecord({
        type: 'project',
        id: remoteIdGuid('project', projectid, memory.keyMap),
      })
    ) as Project;
  };
  const createZip = (zip: AdmZip, projRec: Project) => {
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
      zip.addLocalFile(local, path.dirname(name), path.basename(name));
    };
    const AddUserAvatars = (recs: Record[]) => {
      recs.forEach((u) => {
        var user = u as User;
        if (
          user.attributes &&
          user.attributes.avatarUrl !== null &&
          user.attributes.avatarUrl !== ''
        )
          AddStreamEntry(
            DataPath(user.attributes.avatarUrl),
            user.attributes.avatarUrl
          );
      });
    };
    const AddOrgLogos = (recs: Record[]) => {
      recs.forEach((o) => {
        var org = o as Organization;
        if (
          org.attributes &&
          org.attributes.logoUrl !== null &&
          org.attributes.logoUrl !== ''
        )
          AddStreamEntry(
            DataPath(org.attributes.logoUrl),
            org.attributes.logoUrl
          );
      });
    };
    const AddMediaFiles = (recs: Record[]) => {
      recs.forEach((m) => {
        var mf = m as MediaFile;
        if (mf.attributes)
          AddStreamEntry(
            DataPath(mf.attributes.audioUrl),
            mf.attributes.audioUrl
          );
        const eafCode = getMediaEaf(mf, memory);
        const name =
          path.basename(
            mf.attributes.audioUrl,
            path.extname(mf.attributes.audioUrl)
          ) + '.eaf';
        zip.addFile(
          'media/' + name,
          Buffer.alloc(eafCode.length, eafCode),
          'EAF'
        );
      });
    };

    const AddFonts = () => {
      const dir = DataPath('fonts');
      var items = fs.readdirSync(dir);
      for (var i = 0; i < items.length; i++) {
        zip.addLocalFile(path.join(dir, items[i]), 'fonts', items[i]);
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
      if (recs && isArray(recs) && recs.length > 0) {
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
      }
    };

    const AddAll = (info: fileInfo, project: Project | undefined) => {
      var recs = GetTableRecs(info, project);
      console.log(info.table, recs.length);
      if (recs && isArray(recs) && recs.length > 0) {
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
      if (p && isArray(p)) return p.length === 1;
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
    const imported = moment.utc(
      projRec.attributes.dateImported || '01/01/1900'
    );
    AddSourceEntry(projRec.attributes.dateImported || '');
    AddVersionEntry('1'); //TODO: ask what version indexeddb is
    const limit = onlyOneProject() ? undefined : projRec;
    if (exportType === 'itf') {
      const exported = AddCheckEntry();
      projRec.attributes.dateExported = exported;
      updateableFiles.forEach((info) => AddChanged(info, limit));
      memory.update((t: TransformBuilder) => t.updateRecord(projRec));
    } else {
      projRec.attributes.dateExported = projRec.attributes.dateImported;
      updateableFiles.forEach((info) => AddAll(info, limit));
      staticFiles.forEach((info) => AddAll(info, limit));
      AddFonts();
    }
    return zip;
  };
  var projects: Project[];
  var backupZip: AdmZip | undefined;
  if (exportType === 'zip') {
    projects = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('project')
    ) as Project[];
    backupZip = new AdmZip();
    exportType = 'ptf';
  } else {
    projects = [getProjRec(projectid.toString())];
  }
  for (var ix: number = 0; ix < projects.length; ix++) {
    const zip = createZip(new AdmZip(), projects[ix]);
    const filename = fileName(projects[ix]);
    if (backupZip) {
      backupZip.addFile(filename, zip.toBuffer(), projects[ix].attributes.name);
    } else {
      var where = DataPath(filename);
      zip.writeZip(where);
      return BuildFileResponse(where, filename);
    }
  }
  var backupWhere = DataPath(backupName);
  if (backupZip) backupZip.writeZip(backupWhere);
  return BuildFileResponse(backupWhere, backupName);
}
