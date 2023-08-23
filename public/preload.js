// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { ipcRenderer, contextBridge } = require('electron');

// Expose protected methods off of window (ie.
// window.api.sendToA) in order to use ipcRenderer
// without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  appData: async () => await ipcRenderer.invoke('appData'),
  audacityOpen: async () => await ipcRenderer.invoke('audacityOpen'),
  availSpellLangs: async () => await ipcRenderer.invoke('availSpellLangs'),
  customList: async () => await ipcRenderer.invoke('customList'),
  customRemove: async (value) =>
    await ipcRenderer.invoke('customRemove', value),
  getPath: async (token) => await ipcRenderer.invoke('getPath', token),
  getProfile: async () => await ipcRenderer.invoke('get-profile'),
  getSpellLangs: async () => await ipcRenderer.invoke('getSpellLangs'),
  getToken: async () => await ipcRenderer.invoke('get-token'),
  home: async () => await ipcRenderer.invoke('home'),
  login: async (hasUsed, email) =>
    await ipcRenderer.invoke('login', hasUsed, email),
  logout: async () => await ipcRenderer.invoke('logout'),
  refreshToken: async () => await ipcRenderer.invoke('refresh-token'),
  setAddToDict: async (value) =>
    await ipcRenderer.invoke('setAddToDict', value),
  setSpellLangs: async (codes) =>
    await ipcRenderer.invoke('setSpellLangs', codes),
  temp: async () => await ipcRenderer.invoke('temp'),
  exitApp: async () => await ipcRenderer.invoke('exitApp'),
  relaunchApp: async () => await ipcRenderer.invoke('relaunchApp'),
  closeApp: async () => await ipcRenderer.invoke('closeApp'),
  importOpen: async () => await ipcRenderer.invoke('importOpen'),
  execPath: async () => await ipcRenderer.invoke('execPath'),
  isWindows: async () => await ipcRenderer.invoke('isWindows'),
  isMac: async () => await ipcRenderer.invoke('isMac'),
  isProcessRunning: async (name) =>
    await ipcRenderer.invoke('isProcessRunning', name),
  createFolder: async (folder) =>
    await ipcRenderer.invoke('createFolder', folder),
  exists: async (name) => await ipcRenderer.invoke('exists', name),
  stat: async (folderPath) => await ipcRenderer.invoke('stat', folderPath),
  read: async (filePath, options) =>
    await ipcRenderer.invoke('read', filePath, options),
  write: async (filePath, data, options) =>
    await ipcRenderer.invoke('write', filePath, data, options),
  append: async (filePath, data) =>
    await ipcRenderer.invoke('append', filePath, data),
  delete: async (filePath) => await ipcRenderer.invoke('delete', filePath),
  copyFile: async (from, to) => await ipcRenderer.invoke('copyFile', from, to),
  times: async (filePath, create, modify) =>
    await ipcRenderer.invoke('times', filePath, create, modify),
  readDir: async (folder) => await ipcRenderer.invoke('readDir', folder),
  fileJson: async (settings) => await ipcRenderer.invoke('fileJson', settings),
  shell: async (cmd) => await ipcRenderer.invoke('shell', cmd),
  openExternal: async (item) => await ipcRenderer.invoke('openExternal', item),
  openPath: async (url) => await ipcRenderer.invoke('openPath', url),
  exec: async (cmd, args, opts) =>
    await ipcRenderer.invoke('exec', cmd, args, opts),
  exeCmd: async (cmd, opts) => await ipcRenderer.invoke('exeCmd', cmd, opts),
  zipOpen: async (fullPath) => await ipcRenderer.invoke('zipOpen', fullPath),
  zipGetEntries: async (zip) => await ipcRenderer.invoke('zipGetEntries', zip),
  zipReadText: async (zip, name) =>
    await ipcRenderer.invoke('zipReadText', zip, name),
  zipAddFile: async (zip, name, data, comment) =>
    await ipcRenderer.invoke('zipAddFile', zip, name, data, comment),
  zipAddJson: async (zip, name, data, comment) =>
    await ipcRenderer.invoke('zipAddJson', zip, name, data, comment),
  zipAddZip: async (zip, name, addZip, comment) =>
    await ipcRenderer.invoke('zipAddZip', zip, name, addZip, comment),
  zipAddLocal: async (zip, full, folder, base) =>
    await ipcRenderer.invoke('zipAddLocal', zip, full, folder, base),
  zipToBuffer: async (zip) => await ipcRenderer.invoke('zipToBuffer', zip),
  zipWrite: async (zip, where) =>
    await ipcRenderer.invoke('zipWrite', zip, where),
  zipExtract: async (zip, folder, replace) =>
    await ipcRenderer.invoke('zipExtract', zip, folder, replace),
  zipExtractOpen: async (zip, folder) =>
    await ipcRenderer.invoke('zipExtractOpen', zip, folder),
  zipClose: async (zip) => await ipcRenderer.invoke('zipClose', zip),
  downloadFile: async (url, localFile) =>
    await ipcRenderer.invoke('downloadFile', url, localFile),
  downloadLaunch: async (url, localFile) =>
    await ipcRenderer.invoke('downloadLaunch', url, localFile),
  downloadStat: async (token) =>
    await ipcRenderer.invoke('downloadStat', token),
  downloadClose: async (token) =>
    await ipcRenderer.invoke('downloadClose', token),
});
