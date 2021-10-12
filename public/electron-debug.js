const { app } = require('electron');

const createAppWindow = require('./app-process');
const fileReadProtocol = require('./file-read-protocol');
const ipcMethods = require('./ipcMethods');

//ToDo: Remove this and follow instructions here:
//https://github.com/electron/electron/blob/master/docs/tutorial/security.md#electron-security-warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

async function showWindow() {
  fileReadProtocol();
  return createAppWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', showWindow);

ipcMethods();
