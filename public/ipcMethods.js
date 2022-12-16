const { app, ipcMain, session, dialog, BrowserWindow } = require('electron');
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

  ipcMain.handle('resourcePath', async () => {
    return process.resourcesPath;
  });

  ipcMain.handle('home', async () => {
    return app.getPath('home');
  });

  ipcMain.handle('getPath', async (event, name) => {
    return app.getPath(name);
  });

  ipcMain.handle('exitApp', async () => {
    app.exit();
  });

  ipcMain.handle('relaunchApp', async () => {
    app.relaunch();
  });

  ipcMain.handle('closeApp', async () => {
    for (let w of BrowserWindow.getAllWindows()) {
      w.close();
    }
  });

  ipcMain.handle('appData', () => {
    return process.env.AppData;
  });

  ipcMain.handle('importOpen', () => {
    const options = {
      filters: [{ name: 'ptf', extensions: ['ptf'] }],
      properties: ['openFile'],
    };
    return dialog.showOpenDialogSync(options);
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

  ipcMain.handle('login', async (event, hasUsed, email) => {
    isLogingIn = true;
    isLogOut = false;
    try {
      await authService.refreshTokens();
      isLogingIn = false;
      return createAppWindow();
    } catch (err) {
      isLogingIn = false;
      createAuthWindow(hasUsed, email);
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

  ipcMain.handle('refresh-token', () => {
    if (isLogOut) return null;
    return authService.refreshTokens();
  });

  ipcMain.handle('logout', () => {
    isLogingIn = false;
    isLogOut = true;
    createLogoutWindow();
  });
};

module.exports = ipcMethods;
