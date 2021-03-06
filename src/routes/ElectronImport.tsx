import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import moment, { Moment } from 'moment';
import { OpenDialogSyncOptions } from 'electron';
import { IApiError, Project, IElectronImportStrings, IState } from '../model';
import * as action from '../store';
import { QueryBuilder } from '@orbit/data';
import { remoteIdGuid, useOfflnProjRead } from '../crud';
import {
  dataPath,
  LocalKey,
  localUserKey,
  orbitInfo,
  useProjectsLoaded,
} from '../utils';
import { isElectron } from '../api-variable';
import { useGlobal, useRef } from 'reactn';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { useSnackBar } from '../hoc/SnackBar';
import React from 'react';

export interface IImportData {
  fileName: string;
  projectName: string;
  valid: boolean;
  warnMsg: string | JSX.Element;
  errMsg: string;
  exportDate: string;
}

const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'electronImport' });

//const importStatusSelector = (state: IState) =>
//  state.importexport.importexportStatus;

export const useElectronImport = (
  importComplete: typeof action.importComplete
) => {
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const isOfflinePtf = useRef<boolean>(false);
  const { showTitledMessage } = useSnackBar();
  const getOfflineProject = useOfflnProjRead();
  const AddProjectLoaded = useProjectsLoaded();
  const zipRef = useRef<AdmZip>();
  const t = useSelector(stringSelector, shallowEqual) as IElectronImportStrings;

  const invalidReturn = {
    fileName: '',
    projectName: '',
    valid: false,
    warnMsg: '',
    errMsg: '',
    exportDate: '',
  };
  //var importStatus = useSelector(importStatusSelector, shallowEqual);

  /* if we aren't electron - define these dummies */
  var handleElectronImport = (
    importProjectToElectron: typeof action.importProjectToElectron,
    orbitError: (ex: IApiError) => void
  ): void => {};

  var getElectronImportData = (project: string): IImportData => {
    return invalidReturn;
  };

  if (isElectron) {
    getElectronImportData = (project: string): IImportData => {
      const electronremote = require('@electron/remote');

      const options = {
        //: OpenDialogSyncOptions
        filters: [{ name: 'ptf', extensions: ['ptf'] }],
        properties: ['openFile'],
      } as OpenDialogSyncOptions;
      const filePaths = electronremote.dialog.showOpenDialogSync(options);
      if (!filePaths || filePaths.length === 0) {
        zipRef.current = undefined;
        //they didn't pick a file
        return invalidReturn;
      }
      var zip = new AdmZip(filePaths[0]);
      let valid = false;
      var exportTime: Moment = moment.utc();
      var exportDate = '';
      var zipEntries = zip.getEntries();
      for (let entry of zipEntries) {
        if (entry.entryName === 'SILTranscriber') {
          exportDate = entry.getData().toString('utf8');
          exportTime = moment.utc(exportDate, 'YYYY-MM-DDTHH:MM:SS.SSSSSSSZ');
          valid = true;
          if (isOfflinePtf.current) break;
        } else if (entry.entryName === 'Offline') {
          isOfflinePtf.current = true;
          if (valid) break;
        }
      }
      if (!valid) {
        showTitledMessage(t.importProject, t.ptfError);
        zipRef.current = undefined;
        isOfflinePtf.current = false;
        return { ...invalidReturn, errMsg: t.ptfError };
      }
      //we have a valid file
      zipRef.current = zip;
      var ret: IImportData = {
        fileName: filePaths[0],
        projectName: '',
        valid: true,
        warnMsg: '',
        errMsg: '',
        exportDate: exportDate,
      };
      var infoMsg;
      var userInProject = false;
      var users: Array<string> = [];
      var importUsers = JSON.parse(zip.readAsText('data/A_users.json'));
      if (importUsers && Array.isArray(importUsers.data)) {
        importUsers.data.forEach((u: any) => {
          users.push(u.attributes.name);
          if (
            user === '' ||
            remoteIdGuid('user', u.id, memory.keyMap) ||
            u.id === user
          )
            userInProject = true;
        });
      }
      var importProjs = JSON.parse(zip.readAsText('data/D_projects.json'));
      var importProj: any;
      if (
        importProjs &&
        Array.isArray(importProjs.data) &&
        importProjs.data.length > 0
      ) {
        importProj = importProjs.data[0];
        ret.projectName = importProj.attributes.name;
      } else {
        return { ...invalidReturn, errMsg: t.ptfError };
      }
      infoMsg = (
        <span>
          {filePaths[0]}
          <br />
          <b>
            {t.project}: {ret.projectName}
          </b>
          <br />
          {t.members}: {users.join(',')}
          <br />
          <b>
            {userInProject ? (
              <></>
            ) : (
              <>
                {t.userWontSeeProject}
                <br />
              </>
            )}
          </b>
        </span>
      );

      //if we already have projects...check dates
      const projectRecs = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('project')
      ) as Project[];
      if (projectRecs && projectRecs.length > 0) {
        var projectNames: string = '';
        var id = importProj.id;
        const proj = projectRecs.find(
          (pr) => pr.id === (remoteIdGuid('project', id, memory.keyMap) || id)
        );

        if (project !== '' && project !== proj?.id) {
          showTitledMessage(t.importProject, t.invalidProject);
          zipRef.current = undefined;
          ret.valid = false;
          ret.errMsg = t.invalidProject;
          return ret;
        }

        //was this one exported before our current data?
        if (proj && proj.attributes) {
          projectNames += proj.attributes.name + ',';
          var op = getOfflineProject(proj.id);
          if (
            op &&
            op.attributes.snapshotDate &&
            moment.utc(op.attributes.snapshotDate) > exportTime
          ) {
            ret.warnMsg +=
              t.importCreated.replace('{date0}', exportTime.toLocaleString()) +
              ' ' +
              t.projectImported
                .replace('{name0}', importProj.attributes.name)
                .replace(
                  '{date1}',
                  moment.utc(op.attributes.snapshotDate).toLocaleString()
                ) +
              '  ' +
              t.allDataOverwritten.replace('{name0}', ret.projectName);
          }
          //has our current data never been exported, or exported after incoming?
          if (!op.attributes.exportedDate) {
            ret.warnMsg +=
              t.neverExported.replace('{name0}', ret.projectName) +
              '  ' +
              t.allDataOverwritten.replace('{name0}', ret.projectName);
          } else {
            var myLastExport = moment.utc(op.attributes.exportedDate);
            if (myLastExport > exportTime) {
              ret.warnMsg +=
                t.importCreated.replace(
                  '{date0}',
                  exportTime.toLocaleString()
                ) +
                ' ' +
                t.lastExported
                  .replace('{name0}', ret.projectName)
                  .replace('{date0}', myLastExport.toLocaleString()) +
                '  ' +
                t.exportedLost;
            }
          }
        }

        if (ret.warnMsg === '' && projectNames !== '') {
          //general warning
          ret.warnMsg = t.allDataOverwritten.replace(
            '{name0}',
            projectNames.substring(0, projectNames.length - 1)
          );
        }
      }
      ret.warnMsg = (
        <span>
          {infoMsg}
          <br />
          {ret.warnMsg}
        </span>
      );
      return ret;
    };

    handleElectronImport = (
      importProjectToElectron: typeof action.importProjectToElectron,
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
        //get the exported date from SILTranscriber file
        var dataDate = fs
          .readFileSync(path.join(where, 'SILTranscriber'), {
            encoding: 'utf8',
            flag: 'r',
          })
          .replace(/(\r\n|\n|\r)/gm, '');
        importProjectToElectron(
          path.join(where, 'data'),
          dataDate,
          coordinator,
          isOfflinePtf.current,
          AddProjectLoaded,
          orbitError,
          t.importPending,
          t.importComplete,
          t.importOldFile
        );
        const userLastTimeKey = localUserKey(LocalKey.time, memory);
        let lastTime = localStorage.getItem(userLastTimeKey) || '';
        if (!lastTime || moment(lastTime) > moment(dataDate)) {
          localStorage.setItem(userLastTimeKey, dataDate);
        }
        isOfflinePtf.current = false;
      }
    };
  }
  return { getElectronImportData, handleElectronImport };
};
