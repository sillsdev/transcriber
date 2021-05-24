const { app } = require('electron');

const createAppWindow = require('./app-process');
const fileReadProtocol = require('./file-read-protocol');
const ipcMethods = require('./ipcMethods');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

async function showWindow() {
  fileReadProtocol();
  return createAppWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', showWindow);

ipcMethods();
