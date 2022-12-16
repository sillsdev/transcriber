const {
  app,
  ipcMain,
  session,
  dialog,
  BrowserWindow,
  shell,
} = require('electron');
const createAppWindow = require('./app-process');
const { createAuthWindow, createLogoutWindow } = require('./auth-process');
const authService = require('./auth-service');
const fs = require('fs-extra');
const os = require('os');
const execa = require('execa');

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

  ipcMain.handle('isWindows', async () => {
    return os.platform() === 'win32';
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

  ipcMain.handle('createFolder', async (folder) => {
    try {
      fs.statSync(folder);
    } catch (err) {
      if (err.code === 'ENOENT') fs.mkdirSync(folder, { recursive: true });
    }
  });

  ipcMain.handle('exists', async (name) => {
    return fs.existsSync(name);
  });

  ipcMain.handle('stat', async (name, cb) => {
    return fs.stat(name, cb);
  });

  ipcMain.handle('getStat', async (filePath) => {
    return fs.statSync(filePath);
  });

  ipcMain.handle('createStream', async (filePath) => {
    return fs.createWriteStream(filePath);
  });

  ipcMain.handle('read', async (filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  ipcMain.handle('write', async (filePath, data) => {
    return fs.writeFileSync(filePath, data, { encoding: 'utf-8' });
  });

  ipcMain.handle('append', async (filePath, data) => {
    fs.open(filePath, 'a', (err, fd) => {
      if (err) throw err;
      fs.writeFile(fd, data, (err) => {
        fs.close(fd, (err) => {
          if (err) throw err;
        });
        if (err) throw err;
      });
    });
  });

  ipcMain.handle('delete', async (filePath) => {
    return fs.unlink(filePath);
  });

  ipcMain.handle('copyFile', async (from, to) => {
    return fs.copyFileSync(from, to);
  });

  ipcMain.handle('times', async (filePath, create, update) => {
    fs.utimesSync(filePath, create, update);
  });

  ipcMain.handle('readDir', async (folder) => {
    return fs.readdirSync(folder);
  });

  const convert = require('xml-js');

  ipcMain.handle('fileJson', async (settings) => {
    if (fs.existsSync(settings)) {
      const data = fs.readFileSync(settings, 'utf-8');
      const jsonStr = convert.xml2json(data, { compact: true, spaces: 2 });
      return JSON.parse(jsonStr);
    }
    return null;
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

  ipcMain.handle('shell', async (cmd) => {
    shell(cmd);
  });

  ipcMain.handle('exec', async (cmd, args, opts) => {
    return execa(cmd, args, opts);
  });

  ipcMain.handle('exeCmd', async (cmd, opts) => {
    return execa.command(cmd, opts);
  });

  ipcMain.handle('binaryCopy', async (file, fullName) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      fs.writeFileSync(fullName, evt?.target?.result, {
        encoding: 'binary',
        flag: 'wx', //write - fail if file exists
      });
    };
    reader.readAsBinaryString(file);
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
