const { app, ipcMain } = require('electron');

const createAppWindow = require('./app-process');
const { createAuthWindow, createLogoutWindow } = require('./auth-process');
const authService = require('./auth-service');
const fileReadProtocol = require('./file-read-protocol');

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

let isLogingIn = false;
let isLogOut = false;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !isLogingIn) {
    app.quit();
  }
});

// app.on('activate', () => {
//   if (mainWindow === null) {
//     createWindow();
//   }
// });

ipcMain.handle('temp', async () => {
  return app.getPath('temp');
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
