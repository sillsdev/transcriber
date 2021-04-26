const { app, BrowserWindow, ipcMain, session } = require('electron');

const createAppWindow = require('./app-process');
const { createAuthWindow, createLogoutWindow } = require('./auth-process');
const authService = require('./auth-service');
const electronExtensions = require('./electronExtensions.js');
const fileReadProtocol = require('./file-read-protocol');

//ToDo: Remove thiss and follow instructions here:
//https://github.com/electron/electron/blob/master/docs/tutorial/security.md#electron-security-warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

async function showWindow() {
  electronExtensions(BrowserWindow);
  fileReadProtocol();
  return createAppWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', showWindow);

let isLogingIn = false;
let isLogOut = false;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !isLogingIn) {
    app.quit();
  }
});

ipcMain.handle('availSpellLangs', async () => {
  return session.defaultSession.availableSpellCheckerLanguages;
});

ipcMain.handle('getSpellLangs', async () => {
  return session.defaultSession.getSpellCheckerLanguages();
});

ipcMain.handle('setSpellLangs', async (event, langs) => {
  session.defaultSession.setSpellCheckerLanguages(langs);
});

ipcMain.handle('customList', async () => {
  return session.defaultSession.listWordsInSpellCheckerDictionary();
});

ipcMain.handle('customRemove', async (event, word) => {
  session.defaultSession.removeWordFromSpellCheckerDictionary(word);
});

ipcMain.handle('customAdd', async (event, word) => {
  session.defaultSession.addWordToSpellCheckerDictionary(word);
});

ipcMain.handle('temp', async () => {
  return app.getPath('temp');
});

ipcMain.handle('login', async () => {
  isLogingIn = true;
  isLogOut = false;
  try {
    await authService.refreshTokens();
    isLogingIn = false;
    return createAppWindow();
  } catch (err) {
    isLogingIn = false;
    createAuthWindow();
  }
});

ipcMain.handle('get-profile', () => {
  if (isLogOut) return null;
  return authService.getProfile();
});

ipcMain.handle('get-token', () => {
  if (isLogOut) return null;
  return authService.getAccessToken();
});

ipcMain.handle('logout', () => {
  isLogingIn = false;
  isLogOut = true;
  createLogoutWindow();
});
