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

  ipcMain.handle('execPath', async () => {
    return process.helperExecPath.replace(/\\/g, '/');
  });

  ipcMain.handle('isWindows', async () => {
    return os.platform() === 'win32';
  });

  ipcMain.handle('isProcessRunning', async (event, name) => {
    const platformMap = new Map([
      ['win32', 'tasklist'],
      ['darwin', `ps -ax | grep ${name}`],
      ['linux', `ps -A`],
    ]);
    const cmd = platformMap.get(process.platform);
    return new Promise((resolve, reject) => {
      require('child_process').exec(cmd, (err, stdout, stderr) => {
        if (err) reject(err);

        resolve(stdout.toLowerCase().indexOf(name.toLowerCase()) > -1);
      });
    });
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

  ipcMain.handle('appData', async () => {
    return process.env.AppData;
  });

  ipcMain.handle('createFolder', async (event, folder) => {
    try {
      fs.statSync(folder);
    } catch (err) {
      if (err.code === 'ENOENT') fs.mkdirSync(folder, { recursive: true });
    }
  });

  ipcMain.handle('exists', async (event, name) => {
    return fs.existsSync(name);
  });

  ipcMain.handle('stat', async (event, name, cb) => {
    return fs.stat(name, cb);
  });

  ipcMain.handle('getStat', async (event, filePath) => {
    return fs.statSync(filePath);
  });

  ipcMain.handle('createStream', async (event, filePath) => {
    return fs.createWriteStream(filePath);
  });

  ipcMain.handle('read', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  ipcMain.handle('write', async (event, filePath, data) => {
    return fs.writeFileSync(filePath, data, { encoding: 'utf-8' });
  });

  ipcMain.handle('append', async (event, filePath, data) => {
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

  ipcMain.handle('delete', async (event, filePath) => {
    return fs.unlink(filePath);
  });

  ipcMain.handle('copyFile', async (event, from, to) => {
    return fs.copyFileSync(from, to);
  });

  ipcMain.handle('times', async (event, filePath, create, update) => {
    fs.utimesSync(filePath, create, update);
  });

  ipcMain.handle('readDir', async (event, folder) => {
    return fs.readdirSync(folder);
  });

  const convert = require('xml-js');

  ipcMain.handle('fileJson', async (event, settings) => {
    if (fs.existsSync(settings)) {
      const data = fs.readFileSync(settings, 'utf-8');
      const jsonStr = convert.xml2json(data, { compact: true, spaces: 2 });
      return JSON.parse(jsonStr);
    }
    return null;
  });

  ipcMain.handle('importOpen', async () => {
    const options = {
      filters: [{ name: 'ptf', extensions: ['ptf'] }],
      properties: ['openFile'],
    };
    return dialog.showOpenDialogSync(options);
  });

  ipcMain.handle('audacityOpen', async () => {
    return dialog.showOpenDialogSync({
      filters: [{ name: 'Audacity', extensions: ['aup3'] }],
      properties: ['openFile'],
    });
  });

  ipcMain.handle('openExternal', async (event, cmd) => {
    shell.openExternal(cmd);
  });

  ipcMain.handle('openPath', async (event, cmd) => {
    shell.openPath(cmd);
  });

  ipcMain.handle('exec', async (event, cmd, args, opts) => {
    return execa(cmd, args, opts);
  });

  ipcMain.handle('exeCmd', async (event, cmd, opts) => {
    return execa.command(cmd, opts);
  });

  ipcMain.handle('binaryCopy', async (event, file, fullName) => {
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

  ipcMain.handle('get-profile', async () => {
    if (isLogOut) return null;
    return authService.getProfile();
  });

  ipcMain.handle('get-token', async () => {
    if (isLogOut) return null;
    return authService.getAccessToken();
  });

  ipcMain.handle('refresh-token', async () => {
    if (isLogOut) return null;
    return authService.refreshTokens();
  });

  ipcMain.handle('logout', async () => {
    isLogingIn = false;
    isLogOut = true;
    createLogoutWindow();
  });
};

module.exports = ipcMethods;
