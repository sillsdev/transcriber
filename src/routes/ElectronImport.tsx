/*
import { remote, OpenDialogSyncOptions } from 'electron';
*/
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import moment, { Moment } from 'moment';
import { OpenDialogSyncOptions } from 'electron';
import MemorySource from '@orbit/memory';
import { IApiError, Project, IElectronImportStrings } from '../model';
import * as action from '../store';
import { QueryBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { remoteIdGuid } from '../crud';
import { dataPath, orbitInfo } from '../utils';
import { isArray } from 'util';
import { isElectron } from '../api-variable';

export interface IImportData {
  valid: boolean;
  warnMsg: string;
  errMsg: string;
  zip: AdmZip | null;
}
export var getElectronImportData = (
  memory: MemorySource,
  t: IElectronImportStrings
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
  coordinatorActivated: boolean,
  zip: AdmZip | null,
  importProject: typeof action.importProjectToElectron,
  orbitError: (ex: IApiError) => void,
  t: IElectronImportStrings
): void => {};

if (isElectron) {
  getElectronImportData = (
    memory: MemorySource,
    t: IElectronImportStrings
  ): IImportData => {
    var electron = require('electron');
    const options = {
      //: OpenDialogSyncOptions
      filters: [{ name: 'ptf', extensions: ['ptf'] }],
      properties: ['openFile'],
    } as OpenDialogSyncOptions;
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
      var importProjs = JSON.parse(zip.readAsText('data/D_projects.json'));
      if (
        importProjs &&
        isArray(importProjs.data) &&
        importProjs.data.length > 0
      ) {
        importProjs.data.forEach((p: any) => {
          var id = p.id;
          const proj = projectRecs.find(
            (pr) => pr.id === remoteIdGuid('project', id, memory.keyMap)
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
                t.allDataOverwritten.replace('{name0}', p.attributes.name);
            }
            //has our current data never been exported, or exported after incoming?
            if (!proj.attributes.dateExported) {
              ret.warnMsg +=
                t.neverExported.replace('{name0}', p.attributes.name) +
                '  ' +
                t.allDataOverwritten.replace('{name0}', p.attributes.name);
            } else {
              var myLastExport = moment.utc(proj.attributes.dateExported);
              if (myLastExport > exportTime) {
                ret.warnMsg +=
                  t.importCreated.replace(
                    '{date0}',
                    exportTime.toLocaleString()
                  ) +
                  ' ' +
                  t.lastExported
                    .replace('{name0}', p.attributes.name)
                    .replace('{date0}', myLastExport.toLocaleString()) +
                  '  ' +
                  t.exportedLost;
              }
            }
          }
        });
        if (ret.warnMsg === '' && projectNames !== '') {
          //general warning
          ret.warnMsg = t.allDataOverwritten.replace(
            '{name0}',
            projectNames.substring(0, projectNames.length - 1)
          );
        }
      }
    }
    return ret;
  };

  handleElectronImport = (
    memory: MemorySource,
    backup: IndexedDBSource,
    coordinatorActivated: boolean,
    zip: AdmZip | null,
    importProject: typeof action.importProjectToElectron,
    orbitError: (ex: IApiError) => void,
    t: IElectronImportStrings
  ): void => {
    if (zip) {
      const where = dataPath();
      fs.mkdirSync(where, { recursive: true });
      //delete any old passagesection files
      try {
        fs.unlinkSync(path.join(where, 'data', 'H_passagesections.json'));
      } catch (err) {
        if (err.errno !== -4058)
          orbitError(
            orbitInfo(err, `Delete failed for ${where} passage sections`)
          );
      }
      zip.extractAllTo(where, true);
      importProject(
        path.join(where, 'data'),
        memory,
        backup,
        coordinatorActivated,
        orbitError,
        t.importPending,
        t.importComplete,
        t.importOldFile
      );
    }
  };
}
