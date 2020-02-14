/*
import { remote, OpenDialogSyncOptions } from 'electron';
*/
import AdmZip from 'adm-zip';

import MemorySource from '@orbit/memory';
import * as action from '../store';

const isElectron = process.env.REACT_APP_MODE === 'electron';
var handleElectronImport = (
  memory: MemorySource,
  importProject: typeof action.importProject,
  pendingMsg: string,
  completeMsg: string
): boolean => {
  return isElectron;
};
if (isElectron) {
  var electron = require('electron');
  handleElectronImport = (
    memory: MemorySource,
    importProject: typeof action.importProject,
    pendingMsg: string,
    completeMsg: string
  ): boolean => {
    const options = {
      //: OpenDialogSyncOptions
      filters: [{ name: 'zip', extensions: ['zip'] }],
      properties: ['openFile'],
    };
    const filePaths = electron.remote.dialog.showOpenDialogSync(options);
    if (filePaths && filePaths.length > 0) {
      var zip = new AdmZip(filePaths[0]);
      let valid = false;
      var zipEntries = zip.getEntries();
      for (let entry of zipEntries) {
        if (entry.entryName === 'SILTranscriber') {
          valid = true;
          break;
        }
      }
      if (!valid) {
        return false;
      }
      zip.extractAllToAsync(
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
        pendingMsg,
        completeMsg
      );
    }
    return true;
  };
}
export default handleElectronImport;
