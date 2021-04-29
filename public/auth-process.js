const { BrowserWindow, Menu, app } = require('electron');
const authService = require('./auth-service');
const createAppWindow = require('./app-process');

let win = null;

function createAuthWindow() {
  destroyAuthWin();

  win = new BrowserWindow({
    width: 1220,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  function workOffline() {
    createAppWindow();
    return destroyAuthWin();
  }

  var menu = Menu.buildFromTemplate([
    {
      label: 'Back',
      submenu: [
        {
          label: 'Abort Login',
          click() {
            return workOffline();
          },
        },
        {
          label: 'Exit',
          click() {
            app.quit();
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  win
    .loadURL(authService.getAuthenticationURL(), {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
    })
    .catch((error) => {
      if (error.code === 'ERR_NAME_NOT_RESOLVED') {
        // allow working offline
        return workOffline();
      }
    });

  const {
    session: { webRequest },
  } = win.webContents;

  const filter = {
    urls: ['http://localhost/callback*'],
  };

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    await authService.loadTokens(url);
    createAppWindow();
    return destroyAuthWin();
  });

  win.on('authenticated', () => {
    destroyAuthWin();
  });

  win.on('closed', () => {
    win = null;
  });
}

function destroyAuthWin() {
  if (!win) return;
  win.close();
  win = null;
}

function createLogoutWindow() {
  const logoutWindow = new BrowserWindow({
    show: false,
  });

  logoutWindow.loadURL(authService.getLogOutUrl());

  logoutWindow.on('ready-to-show', async () => {
    logoutWindow.close();
    await authService.logout();
  });
}

module.exports = {
  createAuthWindow,
  createLogoutWindow,
};
