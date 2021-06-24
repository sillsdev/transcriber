const { app, ipcMain, session, dialog } = require('electron');
const createAppWindow = require('./app-process');
const { createAuthWindow, createLogoutWindow } = require('./auth-process');
const authService = require('./auth-service');

const ipcMethods = () => {
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

  ipcMain.handle('home', async () => {
    return app.getPath('home');
  });

  ipcMain.handle('getPath', async (event, name) => {
    return app.getPath(name);
  });

  ipcMain.handle('appData', () => {
    return process.env.AppData;
  });

  ipcMain.handle('audacityOpen', () => {
    return dialog.showOpenDialogSync({
      filters: [{ name: 'Audacity', extensions: ['aup3'] }],
      properties: ['openFile'],
    });
  });

  let isLogingIn = false;
  let isLogOut = false;

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && !isLogingIn) {
      app.quit();
    }
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
};

module.exports = ipcMethods;
