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
  customRemove: (value) => ipcRenderer.invoke('customRemove', value),
  getPath: async (token) => await ipcRenderer.invoke('getPath', token),
  getProfile: async () => await ipcRenderer.invoke('get-profile'),
  getSpellLangs: async () => await ipcRenderer.invoke('getSpellLangs'),
  getToken: async () => await ipcRenderer.invoke('get-token'),
  home: async () => await ipcRenderer.invoke('home'),
  login: (hasUsed, email) => ipcRenderer.invoke('login', hasUsed, email),
  logout: () => ipcRenderer.invoke('logout'),
  refreshToken: () => ipcRenderer.invoke('refresh-token'),
  setAddToDict: (value) => ipcRenderer.invoke('setAddToDict', value),
  setSpellLangs: (codes) => ipcRenderer.invoke('setSpellLangs', codes),
  temp: async () => await ipcRenderer.invoke('temp'),
  exitApp: async () => await ipcRenderer.invoke('exitApp'),
  relaunchApp: async () => await ipcRenderer.invoke('relaunchApp'),
  closeApp: async () => await ipcRenderer.invoke('closeApp'),
  importOpen: async () => await ipcRenderer.invoke('importOpen'),
  resourcePath: async () => await ipcRenderer.invoke('resourcePath'),
});
