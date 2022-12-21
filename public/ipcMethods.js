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
const AdmZip = require('adm-zip');
const downloadFile = require('./downloadFile');

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

  ipcMain.handle('temp', async () => {
    return app.getPath('temp').replace(/\\/g, '/');
  });

  ipcMain.handle('execPath', async () => {
    return process.helperExecPath.replace(/\\/g, '/');
  });

  ipcMain.handle('home', async () => {
    return app.getPath('home').replace(/\\/g, '/');
  });

  ipcMain.handle('getPath', async (event, name) => {
    return app.getPath(name).replace(/\\/g, '/');
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
    return JSON.stringify(fs.statSync(filePath));
  });

  ipcMain.handle('read', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  ipcMain.handle('write', async (event, filePath, data) => {
    return fs.writeFileSync(filePath, data, { encoding: 'utf-8' });
  });

  ipcMain.handle('append', async (event, filePath, data) => {
    return fs.open(filePath, 'a', (err, fd) => {
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
    return await fs.unlink(filePath);
  });

  ipcMain.handle('copyFile', async (event, from, to) => {
    return await fs.copyFile(from, to);
  });

  ipcMain.handle('times', async (event, filePath, create, update) => {
    return await fs.utimes(filePath, create, update);
  });

  ipcMain.handle('readDir', async (event, folder) => {
    try {
      return fs.readdirSync(folder);
    } catch (err) {
      return err;
    }
  });

  const convert = require('xml-js');

  ipcMain.handle('fileJson', async (event, settings) => {
    if (fs.existsSync(settings)) {
      const data = fs.readFileSync(settings, 'utf-8');
      return convert.xml2json(data, { compact: true, spaces: 2 });
      // return JSON.parse(jsonStr);
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
    return await shell.openExternal(cmd);
  });

  ipcMain.handle('openPath', async (event, cmd) => {
    return await shell.openPath(cmd);
  });

  ipcMain.handle('exec', async (event, cmd, args, opts) => {
    return JSON.stringify(await execa(cmd, args, opts));
  });

  ipcMain.handle('exeCmd', async (event, cmd, opts) => {
    return JSON.stringify(await execa.command(cmd, opts));
  });

  let admZip = [0]; // valid index is not falsey
  ipcMain.handle('zipOpen', async (event, fullPath) => {
    const index = admZip.length;
    admZip.push(fullPath ? new AdmZip(fullPath) : new AdmZip());
    return index;
  });

  ipcMain.handle('zipGetEntries', async (event, zip) => {
    return admZip[zip].getEntries();
  });

  ipcMain.handle('zipReadText', async (event, zip, name) => {
    return admZip[zip].readAsText(name);
  });

  ipcMain.handle('zipAddFile', async (event, zip, name, data, comment) => {
    return admZip[zip].addFile(name, data, comment);
  });

  ipcMain.handle('zipAddLocal', async (event, zip, full, folder, base) => {
    return admZip[zip].addLocalFile(full, folder, base);
  });

  ipcMain.handle('zipToBuffer', async (event, zip) => {
    return admZip[zip].toBuffer();
  });

  ipcMain.handle('zipWrite', async (event, zip, where) => {
    return admZip[zip].writeZip(where);
  });

  ipcMain.handle('zipExtract', async (event, zip, folder, replace) => {
    return admZip[zip].extractAllTo(folder, replace);
  });

  ipcMain.handle('zipClose', async (event, zip) => {
    if (admZip.length - 1 === zip) {
      admZip.pop();
    } else {
      admZip = admZip.slice(0, zip).concat(admZip.slice(zip + 1));
    }
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

  ipcMain.handle('download', async (event, url, localFile, onProgress) => {
    return downloadFile(url, localFile, onProgress);
  });
};

module.exports = ipcMethods;
