/*
import { remote, OpenDialogSyncOptions } from 'electron';
*/
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import moment, { Moment } from 'moment';
import { OpenDialogSyncOptions } from 'electron';
import { IApiError, Project, IElectronImportStrings, IState } from '../model';
import * as action from '../store';
import { QueryBuilder } from '@orbit/data';
import { remoteIdGuid } from '../crud';
import { dataPath, orbitInfo } from '../utils';
import { isArray } from 'util';
import { isElectron } from '../api-variable';
import { useGlobal, useRef } from 'reactn';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { useSnackBar } from '../hoc/SnackBar';

export interface IImportData {
  valid: boolean;
  warnMsg: string;
  errMsg: string;
}

const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'electronImport' });

//const importStatusSelector = (state: IState) =>
//  state.importexport.importexportStatus;

export const useElectronImport = (
  importComplete: typeof action.importComplete
) => {
  const [memory] = useGlobal('memory');
  const [backup] = useGlobal('backup');
  const [coordinatorActivated] = useGlobal('coordinatorActivated');
  const { showTitledMessage } = useSnackBar();
  const zipRef = useRef<AdmZip>();
  const t = useSelector(stringSelector, shallowEqual) as IElectronImportStrings;
  //var importStatus = useSelector(importStatusSelector, shallowEqual);

  /* if we aren't electron - define these dummies */
  var handleElectronImport = (
    importProject: typeof action.importProjectToElectron,
    orbitError: (ex: IApiError) => void
  ): void => {};

  var getElectronImportData = (): IImportData => {
    return {
      valid: false,
      warnMsg: '',
      errMsg: 'We should never get here',
    };
  };

  if (isElectron) {
    getElectronImportData = (): IImportData => {
      var electron = require('electron');
      const options = {
        //: OpenDialogSyncOptions
        filters: [{ name: 'ptf', extensions: ['ptf'] }],
        properties: ['openFile'],
      } as OpenDialogSyncOptions;
      const filePaths = electron.remote.dialog.showOpenDialogSync(options);
      if (!filePaths || filePaths.length === 0) {
        zipRef.current = undefined;
        //they didn't pick a file
        return { valid: false, warnMsg: '', errMsg: '' };
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
        showTitledMessage(t.importProject, t.ptfError);
        zipRef.current = undefined;
        return {
          valid: false,
          warnMsg: '',
          errMsg: t.ptfError,
        };
      }
      //we have a valid file
      zipRef.current = zip;
      var ret: IImportData = { valid: true, warnMsg: '', errMsg: '' };
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
      importProject: typeof action.importProjectToElectron,
      orbitError: (ex: IApiError) => void
    ): void => {
      if (zipRef.current) {
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
        zipRef.current.extractAllTo(where, true);
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
  return { getElectronImportData, handleElectronImport };
};
