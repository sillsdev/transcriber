const { app, BrowserWindow } = require('electron');

const createAppWindow = require('./app-process');
const electronExtensions = require('./electronExtensions.js');
const fileReadProtocol = require('./file-read-protocol');
const ipcMethods = require('./ipcMethods');

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

ipcMethods();
