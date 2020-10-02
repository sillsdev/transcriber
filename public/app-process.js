const { BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createAppWindow() {
  mainWindow = new BrowserWindow({
    width: 1064,
    height: 768,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: { webSecurity: false, nodeIntegration: true },
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

module.exports = createAppWindow;
