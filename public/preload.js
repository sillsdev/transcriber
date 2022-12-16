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
  resourcePath: async () => await ipcRenderer.invoke('resourcePath'),
  isWindows: async () => await ipcRenderer.invoke('isWindows'),
  createFolder: async (folder) =>
    await ipcRenderer.invoke('createFolder', folder),
  createStream: async (filePath) =>
    await ipcRenderer.invoke('createStream', filePath),
  exists: async (name) => await ipcRenderer.invoke('exists', name),
  stat: async (name, cb) => await ipcRenderer.invoke('stat', name, cb),
  getStat: async (folderPath) =>
    await ipcRenderer.invoke('getStat', folderPath),
  read: async (filePath) => await ipcRenderer.invoke('read', filePath),
  write: async (filePath, data) =>
    await ipcRenderer.invoke('write', filePath, data),
  append: async (filePath, data) =>
    await ipcRenderer.invoke('append', filePath, data),
  delete: async (filePath) => await ipcRenderer.invoke('delete', filePath),
  copyFile: async (from, to) => await ipcRenderer.invoke('copyFile', from, to),
  binaryCopy: async (file, filePath) =>
    await ipcRenderer.invoke('binaryCopy', file, filePath),
  times: async (filePath, create, modify) =>
    await ipcRenderer.invoke('times', filePath, create, modify),
  readDir: async (folder) => await ipcRenderer.invoke('readDir', folder),
  fileJson: async (settings) => await ipcRenderer.invoke('fileJson', settings),
  shell: async (cmd) => await ipcRenderer.invoke('shell', cmd),
  exec: async (cmd, args, opts) =>
    await ipcRenderer.invoke('exec', cmd, args, opts),
  exeCmd: async (cmd, opts) => await ipcRenderer.invoke('exeCmd', cmd, opts),
});
