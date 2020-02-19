/*
import { remote, OpenDialogSyncOptions } from 'electron';
*/
import AdmZip from 'adm-zip';

import MemorySource from '@orbit/memory';
import * as action from '../store';
import { QueryBuilder } from '@orbit/data';
import { Project, IAccessStrings } from '../model';
import { isArray } from 'util';
import { remoteIdGuid } from '../utils';
import moment, { Moment } from 'moment';
import IndexedDBSource from '@orbit/indexeddb';

const isElectron = process.env.REACT_APP_MODE === 'electron';

export interface IImportData {
  valid: boolean;
  warnMsg: string;
  errMsg: string;
  zip: AdmZip | null;
}
export var getElectronImportData = (
  memory: MemorySource,
  t: IAccessStrings
): IImportData => {
  return {
    valid: false,
    warnMsg: '',
    errMsg: 'We should never get here',
    zip: null,
  };
};
export var handleElectronImport = (
  memory: MemorySource,
  backup: IndexedDBSource,
  zip: AdmZip | null,
  importProject: typeof action.importProject,
  t: IAccessStrings
): void => {};

if (isElectron) {
  getElectronImportData = (
    memory: MemorySource,
    t: IAccessStrings
  ): IImportData => {
    var electron = require('electron');
    const options = {
      //: OpenDialogSyncOptions
      filters: [{ name: 'zip', extensions: ['zip'] }],
      properties: ['openFile'],
    };
    const filePaths = electron.remote.dialog.showOpenDialogSync(options);
    if (!filePaths || filePaths.length === 0) {
      //they didn't pick a file
      return { valid: false, warnMsg: '', errMsg: '', zip: null };
    }
    var zip = new AdmZip(filePaths[0]);
    let valid = false;
    var exportTime: Moment;
    var zipEntries = zip.getEntries();
    for (let entry of zipEntries) {
      if (entry.entryName === 'SILTranscriber') {
        exportTime = moment.utc(entry.getData().toString('utf8'));
        valid = true;
        break;
      }
    }
    if (!valid) {
      return {
        valid: false,
        warnMsg: '',
        errMsg: t.ptfError,
        zip: null,
      };
    }
    //we have a valid file
    var ret: IImportData = { valid: true, warnMsg: '', errMsg: '', zip: zip };
    //if we already have projects...check dates
    const projectRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('project')
    ) as Project[];
    if (projectRecs && projectRecs.length > 0) {
      var projectNames: string = '';
      var x = JSON.parse(zip.readAsText('data/D_projects.json'));
      if (x && isArray(x.data) && x.data.length > 0) {
        x.data.forEach((p: any) => {
          var id = p.id;
          const proj = projectRecs.find(
            pr => (pr.id = remoteIdGuid('project', id, memory.keyMap))
          );
          //was this one exported before our current data?
          if (proj && proj.attributes) {
            projectNames += proj.attributes.name + ',';
            if (
              proj.attributes.dateImported &&
              moment.utc(proj.attributes.dateImported) > exportTime
            ) {
              ret.warnMsg +=
                t.importCreated.replace(
                  '{date0}',
                  exportTime.toLocaleString()
                ) +
                ' ' +
                t.projectImported
                  .replace('{name0}', p.attributes.name)
                  .replace(
                    '{date1}',
                    moment.utc(proj.attributes.dateImported).toLocaleString()
                  ) +
                '  ' +
                t.allDataOverwritten;
            }
            //has our current data never been exported, or exported after incoming?
            if (!proj.attributes.dateExported) {
              ret.warnMsg +=
                t.neverExported.replace('{name0}', p.attributes.name) +
                '  ' +
                t.allDataOverwritten;
            } else if (moment.utc(proj.attributes.dateExported) > exportTime) {
              ret.warnMsg +=
                t.importCreated.replace(
                  '{date0}',
                  exportTime.toLocaleString()
                ) +
                ' ' +
                t.lastExported
                  .replace('{name0}', p.attributes.name)
                  .replace(
                    '{date0}',
                    moment.utc(proj.attributes.dateExported).toLocaleString
                  ) +
                '  ' +
                t.exportedLost;
            }
          }
        });
        if (ret.warnMsg === '') {
          //general warning
          ret.warnMsg =
            projectNames.substring(0, projectNames.length - 1) +
            ' data will be overwritten.';
        }
      }
    }
    return ret;
  };

  handleElectronImport = (
    memory: MemorySource,
    backup: IndexedDBSource,
    zip: AdmZip | null,
    importProject: typeof action.importProject,
    t: IAccessStrings
  ): void => {
    if (zip) {
      zip.extractAllTo(
        process.env.REACT_APP_OFFLINEDATA
          ? process.env.REACT_APP_OFFLINEDATA
          : '/transcriber/',
        true
      );
      importProject(
        process.env.REACT_APP_OFFLINEDATA
          ? process.env.REACT_APP_OFFLINEDATA
          : '/transcriber/',
        memory,
        backup,
        t.importPending,
        t.importComplete
      );
    }
  };
}
