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
const StreamZip = require('node-stream-zip');
const AdmZip = require('adm-zip');
const {
  downloadFile,
  downloadStatus,
  downloadClose,
} = require('./downloadFile');
const generateUUID = require('./generateUUID');
const convert = require('xml-js');
const ChildProcess = require('child_process');
// execa is an ESM module so we included source to make it work
const execa = require('./execa');
const { normalize } = require('./normalizer');

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
    return process.platform === 'win32';
  });

  ipcMain.handle('isMac', async () => {
    return process.platform === 'darwin';
  });

  ipcMain.handle('isProcessRunning', async (event, name) => {
    const platformMap = new Map([
      ['win32', 'tasklist'],
      ['darwin', `ps -ax | grep ${name}`],
      ['linux', `ps -A`],
    ]);
    const cmd = platformMap.get(process.platform);
    return new Promise((resolve, reject) => {
      ChildProcess.exec(cmd, (err, stdout, stderr) => {
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

  ipcMain.handle('stat', async (event, filePath) => {
    try {
      const stats = fs.statSync(filePath);
      return JSON.stringify(stats);
    } catch (err) {
      return JSON.stringify(err);
    }
  });

  ipcMain.handle('read', async (event, filePath, options) => {
    return fs.readFileSync(filePath, options);
  });

  ipcMain.handle('write', async (event, filePath, data, options) => {
    return fs.writeFileSync(filePath, data, { encoding: 'utf-8', ...options });
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
      return JSON.stringify(err);
    }
  });

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

  let admZip = new Map();
  ipcMain.handle('zipOpen', async (event, fullPath) => {
    const index = generateUUID();
    admZip.set(index, fullPath ? new AdmZip(fullPath) : new AdmZip());
    return index;
  });

  ipcMain.handle('zipGetEntries', async (event, zip) => {
    return JSON.stringify(admZip.get(zip).getEntries());
  });

  ipcMain.handle('zipReadText', async (event, zip, name) => {
    return admZip.get(zip).readAsText(name);
  });

  ipcMain.handle('zipAddFile', async (event, zip, name, data, comment) => {
    admZip.get(zip).addFile(name, Buffer.alloc(data.length, data), comment);
    return true;
  });

  ipcMain.handle('zipAddJson', async (event, zip, name, data, comment) => {
    admZip.get(zip).addFile(name, Buffer.from(JSON.parse(data)), comment);
    return true;
  });

  ipcMain.handle('zipAddZip', async (event, zip, name, addZip, comment) => {
    admZip.get(zip).addFile(name, admZip.get(addZip).toBuffer(), comment);
    return true;
  });

  ipcMain.handle('zipAddLocal', async (event, zip, full, folder, base) => {
    admZip.get(zip).addLocalFile(full, folder, base);
    return true;
  });

  ipcMain.handle('zipToBuffer', async (event, zip) => {
    return admZip.get(zip).toBuffer();
  });

  ipcMain.handle('zipWrite', async (event, zip, where) => {
    admZip.get(zip).writeZip(where);
    return true;
  });

  ipcMain.handle('zipExtract', async (event, zip, folder, replace) => {
    admZip.get(zip).extractAllTo(folder, replace);
    return true;
  });

  ipcMain.handle('zipClose', async (event, zip) => {
    admZip.delete(zip);
  });

  ipcMain.handle('zipStreamExtract', async (event, zip, folder) => {
    const zipStrm = new StreamZip.async({ file: zip });
    const count = await zipStrm.extract(null, folder);
    console.log(`Extracted ${count} entries`);
    await zipStrm.close();
    return true;
  });

  let zipStr = new Map();
  ipcMain.handle('zipStreamOpen', async (event, fullPath) => {
    const index = generateUUID();
    zipStr.set(
      index,
      new StreamZip.async({ file: fullPath, nameEncoding: 'utf8' })
    );
    return index;
  });

  ipcMain.handle('zipStreamEntries', async (event, zip) => {
    return JSON.stringify(await zipStr.get(zip).entries());
  });

  ipcMain.handle('zipStreamEntry', async (event, zip, name) => {
    return JSON.stringify(await zipStr.get(zip).entry(name));
  });

  ipcMain.handle('zipStreamEntryData', async (event, zip, name) => {
    return await zipStr.get(zip).entryData(name);
  });

  ipcMain.handle('zipStreamEntryText', async (event, zip, name) => {
    const data = await zipStr.get(zip).entryData(name);
    return String.fromCharCode(...Array.from(data));
  });

  ipcMain.handle('zipStreamClose', async (event, zip) => {
    if (zipStr.has(zip)) {
      await zipStr.get(zip).close();
      zipStr.delete(zip);
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

  ipcMain.handle('downloadFile', async (event, url, localFile) => {
    if (process.platform === 'win32')
      localFile = localFile.replace(/\//g, '\\');
    try {
      await downloadFile(url, localFile);
      return;
    } catch (err) {
      return JSON.stringify(err);
    }
  });

  ipcMain.handle('downloadLaunch', async (event, url, localFile) => {
    if (process.platform === 'win32')
      localFile = localFile.replace(/\//g, '\\');
    const token = generateUUID();
    await downloadFile(url, localFile, token);
    return token;
  });

  ipcMain.handle('downloadStat', async (event, token) => {
    return downloadStatus(token);
  });

  ipcMain.handle('downloadClose', async (event, token) => {
    downloadClose(token);
    return;
  });

  ipcMain.handle('normalize', async (event, input, output) => {
    if (process.platform === 'win32') {
      input = input.replace(/\//g, '\\');
      output = output.replace(/\//g, '\\');
    }
    try {
      // see: https://www.electronjs.org/docs/latest/tutorial/asar-archives#executing-binaries-inside-asar-archive
      // we modified the code from ffmpeg-normalize to make it work with electronjs
      // we replaced child_process.exec with child_process.execFile
      await normalize({
        input,
        output,
        loudness: {
          normalization: 'ebuR128',
          target: {
            input_i: -23,
            input_lra: 7.0,
            input_tp: -2.0,
          },
        },
        verbose: true,
      });
      return;
    } catch (error) {
      console.error(error);
      return JSON.stringify(error);
    }
  });
};

module.exports = ipcMethods;
