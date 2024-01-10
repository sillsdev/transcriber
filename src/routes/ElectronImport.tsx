import path from 'path-browserify';
import moment, { Moment } from 'moment';
import { IElectronImportStrings, IState, IApiError, ProjectD } from '../model';
import {
  remoteIdGuid,
  useArtifactType,
  useOfflineSetup,
  useOfflnProjRead,
} from '../crud';
import {
  dataPath,
  LocalKey,
  localUserKey,
  orbitInfo,
  useProjectsLoaded,
} from '../utils';
import { isElectron } from '../api-variable';
import { useContext, useRef } from 'react';
import { useGlobal } from 'reactn';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { useSnackBar } from '../hoc/SnackBar';
import IndexedDBSource from '@orbit/indexeddb';
import { TokenContext } from '../context/TokenProvider';
import { ImportProjectToElectronProps } from '../store';
import { RecordKeyMap } from '@orbit/records';
const ipc = (window as any)?.electron;

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

export const useElectronImport = () => {
  const [coordinator] = useGlobal('coordinator');
  const token = useContext(TokenContext).state.accessToken;
  const [errorReporter] = useGlobal('errorReporter');
  const offlineSetup = useOfflineSetup();
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const isOfflinePtf = useRef<boolean>(false);
  const { showTitledMessage } = useSnackBar();
  const getOfflineProject = useOfflnProjRead();
  const AddProjectLoaded = useProjectsLoaded();
  const zipRef = useRef<string>();
  const t = useSelector(stringSelector, shallowEqual) as IElectronImportStrings;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const { getTypeId } = useArtifactType();

  const invalidReturn = {
    fileName: '',
    projectName: '',
    valid: false,
    warnMsg: '',
    errMsg: '',
    exportDate: '',
  };
  //var importStatus = useSelector(importStatusSelector, shallowEqual);

  const getData = async (zip: string, name: string) => {
    const text = (await ipc?.zipStreamEntryText(zip, name)) as string;
    return text.replace(/(\r\n|\n|\r)/gm, '');
  };

  interface IEntry {
    attr: number;
    comLen: number; // comment length
    comment: string | null;
    compressedSize: number;
    crc: number;
    diskStart: number;
    extraLen: number;
    flags: number;
    fnameLen: number;
    headerOffset: number;
    inattr: number;
    isDirectory: boolean;
    method: number;
    name: string;
    offset: number;
    size: number;
    time: number;
    verMade: number;
    version: number;
  }

  const getElectronImportData = async (
    project: string
  ): Promise<IImportData> => {
    if (!isElectron) return invalidReturn;
    const filePaths = await ipc?.importOpen();
    if (!filePaths || filePaths.length === 0) {
      zipRef.current = undefined;
      //they didn't pick a file
      return invalidReturn;
    }
    var zip = await ipc?.zipStreamOpen(filePaths[0]);
    let valid = false;
    var exportTime: Moment = moment.utc();
    var exportDate = '';
    var version = '3';
    var zipEntries = JSON.parse(await ipc?.zipStreamEntries(zip));
    for (let entry of Object.values(zipEntries) as IEntry[]) {
      if (entry.name === 'SILTranscriber') {
        exportDate = await getData(zip, 'SILTranscriber');
        exportTime = moment.utc(exportDate, 'YYYY-MM-DDTHH:mm:ss.SSSSSSSZ');
        valid = true;
        if (isOfflinePtf.current) break;
      } else if (entry.name === 'Offline') {
        isOfflinePtf.current = true;
        if (valid) break;
      } else if (entry.name === 'Version') {
        version = await getData(zip, 'Version');
      }
    }
    if (!valid) {
      showTitledMessage(t.importProject, t.ptfError);
      zipRef.current = undefined;
      isOfflinePtf.current = false;
      return { ...invalidReturn, errMsg: t.ptfError };
    }

    //we have a valid file
    zipRef.current = filePaths[0];
    var ret: IImportData = {
      fileName: filePaths[0],
      projectName: '',
      valid: true,
      warnMsg: '',
      errMsg: '',
      exportDate: exportDate,
    };
    var infoMsg;
    if ((backup?.schema.version || 1) < parseInt(version)) {
      ret.warnMsg = t.newerVersion;
    }
    var userInProject = false;
    var users: Array<string> = [];
    var importUsers = JSON.parse(
      await ipc?.zipStreamEntryText(zip, 'data/A_users.json')
    );
    if (importUsers && Array.isArray(importUsers.data)) {
      importUsers.data.forEach((u: any) => {
        users.push(u.attributes.name);
        if (
          user === '' ||
          remoteIdGuid('user', u.id, memory.keyMap as RecordKeyMap) ||
          u.id === user
        )
          userInProject = true;
      });
    }
    var importProjs = JSON.parse(
      await ipc?.zipStreamEntryText(zip, 'data/D_projects.json')
    );
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
    const projectRecs = memory.cache.query((q) =>
      q.findRecords('project')
    ) as ProjectD[];
    if (projectRecs && projectRecs.length > 0) {
      var projectNames: string = '';
      var id = importProj.id;
      const proj = projectRecs.find(
        (pr) =>
          pr.id ===
          (remoteIdGuid('project', id, memory.keyMap as RecordKeyMap) || id)
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
          op.attributes &&
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
        if (!op.attributes || !op.attributes.exportedDate) {
          ret.warnMsg +=
            t.neverExported.replace('{name0}', ret.projectName) +
            '  ' +
            t.allDataOverwritten.replace('{name0}', ret.projectName);
        } else {
          var myLastExport = moment.utc(op.attributes.exportedDate);
          if (myLastExport > exportTime) {
            ret.warnMsg +=
              t.importCreated.replace('{date0}', exportTime.toLocaleString()) +
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

  const getFileText = async (folder: string, name: string) => {
    const value = (await ipc?.read(path.join(folder, name), 'utf-8')) as string;
    return value.replace(/(\r\n|\n|\r)/gm, '');
  };

  const handleElectronImport = async (
    importProjectToElectron: (props: ImportProjectToElectronProps) => void,
    reportError: (ex: IApiError) => void
  ): Promise<void> => {
    if (!isElectron) return;
    if (zipRef.current) {
      const where = dataPath();
      await ipc?.createFolder(where);
      //delete any old files
      try {
        if (await ipc?.exists(path.join(where, 'SILTranscriber')))
          await ipc?.delete(path.join(where, 'SILTranscriber'));
        if (await ipc?.exists(path.join(where, 'Version')))
          await ipc?.delete(path.join(where, 'Version'));
        var datapath = path.join(where, 'data');
        if (await ipc?.exists(datapath)) {
          const files = await ipc?.readDir(datapath);
          for (const file of files) {
            await ipc?.delete(path.join(datapath, file));
          }
        }
      } catch (err: any) {
        if (err.errno !== -4058)
          reportError(orbitInfo(err, `Delete failed for ${where}`));
      }
      await ipc?.zipStreamExtract(zipRef.current, where);
      //get the exported date from SILTranscriber file
      var dataDate = await getFileText(where, 'SILTranscriber');
      var versionstr = '3';
      if (await ipc?.exists(path.join(where, 'Version')))
        versionstr = await getFileText(where, 'Version');
      var version = parseInt(versionstr);
      importProjectToElectron({
        filepath: path.join(where, 'data'),
        dataDate,
        version,
        coordinator,
        offlineOnly: isOfflinePtf.current,
        AddProjectLoaded,
        reportError,
        getTypeId,
        pendingmsg: t.importPending,
        completemsg: t.importComplete,
        oldfilemsg: t.importOldFile,
        token,
        user,
        errorReporter,
        offlineSetup,
      });
      const userLastTimeKey = localUserKey(LocalKey.time);
      let lastTime = localStorage.getItem(userLastTimeKey) || '';
      if (!lastTime || moment(lastTime) > moment(dataDate)) {
        localStorage.setItem(userLastTimeKey, dataDate);
      }
      isOfflinePtf.current = false;
    }
  };
  return { getElectronImportData, handleElectronImport };
};
