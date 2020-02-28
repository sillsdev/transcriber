import { FileResponse } from './types';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { OfflineDataPath } from '../../utils/offlineDataPath';
import { Project, User, MediaFile, Organization } from '../../model';
import { cleanFileName, remoteIdGuid, getMediaEaf } from '../../utils';
import Memory from '@orbit/memory';
import { JSONAPISerializerCustom } from '../../serializers/JSONAPISerializerCustom';
import { QueryBuilder, Record, TransformBuilder } from '@orbit/data';
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
          contenttype: 'application/zip',
        },
        type: 'file-responses',
        id: '1',
      },
    };
  };

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
    zip.addFile('SILTranscriber', Buffer.alloc(dt.length, dt), 'Imported Date');
    return dt;
  };
  const AddJsonEntry = (table: string, recs: Record[], sort: string) => {
    //put in the remoteIds for everything, then stringify
    var json = JSON.stringify(ser.serializeRecords(recs));
    zip.addFile(
      'data/' + sort + '_' + table + '.json',
      Buffer.alloc(json.length, json),
      table
    );
  };
  const AddStreamEntry = (local: string, name: string) => {
    zip.addLocalFile(local, path.dirname(name), path.basename(name));
  };
  const AddUserAvatars = (recs: Record[]) => {
    recs.forEach(u => {
      var user = u as User;
      if (
        user.attributes &&
        user.attributes.avatarUrl !== null &&
        user.attributes.avatarUrl !== ''
      )
        AddStreamEntry(
          path.join(OfflineDataPath(), user.attributes.avatarUrl),
          user.attributes.avatarUrl
        );
    });
  };
  const AddOrgLogos = (recs: Record[]) => {
    recs.forEach(o => {
      var org = o as Organization;
      if (
        org.attributes &&
        org.attributes.logoUrl !== null &&
        org.attributes.logoUrl !== ''
      )
        AddStreamEntry(
          path.join(OfflineDataPath(), org.attributes.logoUrl),
          org.attributes.logoUrl
        );
    });
  };
  const AddMediaFiles = (recs: Record[]) => {
    recs.forEach(m => {
      var mf = m as MediaFile;
      if (mf.attributes)
        AddStreamEntry(
          path.join(OfflineDataPath(), mf.attributes.audioUrl),
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
    const dir = path.join(OfflineDataPath(), 'fonts');
    var items = fs.readdirSync(dir);
    for (var i = 0; i < items.length; i++) {
      zip.addLocalFile(path.join(dir, items[i]), 'fonts', items[i]);
    }
  };

  const AddChanged = (info: fileInfo) => {
    var recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(info.table)
    );
    if (recs && isArray(recs) && recs.length > 0) {
      var changed = recs.filter(
        u => u.attributes && moment.utc(u.attributes.dateUpdated) > imported
      );
      AddJsonEntry(info.table + 's', changed, info.sort);
      switch (info.table) {
        case 'user':
          AddUserAvatars(changed);
          break;

        case 'mediafile':
          var newOnly = changed.filter(
            m => m.attributes && moment.utc(m.attributes.dateCreated) > imported
          );
          AddMediaFiles(newOnly);
      }
    }
  };

  const AddAll = (info: fileInfo) => {
    var recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(info.table)
    );
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

  const projRec = memory.cache.query((q: QueryBuilder) =>
    q.findRecord({
      type: 'project',
      id: remoteIdGuid('project', projectid.toString(), memory.keyMap),
    })
  ) as Project;
  if (!projRec) {
    return null;
  }

  const fileName =
    'Transcriber' +
    userid +
    '_' +
    projectid +
    '_' +
    cleanFileName(projRec.attributes.name) +
    '.' +
    exportType;

  interface fileInfo {
    table: string;
    sort: string;
  }
  const updateableFiles = [
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
    { table: 'project', sort: 'D' },
    { table: 'plan', sort: 'E' },
    { table: 'projectintegration', sort: 'E' }, //do we care that they synced locally??
    { table: 'passagesection', sort: 'H' },
  ];
  const zip = new AdmZip();
  const imported = moment.utc(projRec.attributes.dateImported || '01/01/1900');
  AddSourceEntry(projRec.attributes.dateImported || '');
  if (exportType === 'itf') {
    const exported = AddCheckEntry();
    updateableFiles.forEach(AddChanged);
    projRec.attributes.dateExported = exported;
    memory.update((t: TransformBuilder) => t.updateRecord(projRec));
  } else {
    updateableFiles.forEach(AddAll);
    staticFiles.forEach(AddAll);
    AddFonts();
  }
  var where = path.join(OfflineDataPath(), fileName);
  console.log('writing zip');
  zip.writeZip(where);
  return BuildFileResponse(where, fileName);
}
