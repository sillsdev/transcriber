const { BrowserWindow, Menu, app } = require('electron');
const authService = require('./auth-service');
const createAppWindow = require('./app-process');
const path = require('path');
const isDev = require('electron-is-dev');

let win = null;

function createAuthWindow(hasUsed, email) {
  destroyAuthWin();

  win = new BrowserWindow({
    width: 1000,
    height: 780,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      devTools: isDev,
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
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
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

  // Full userAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
  win
    .loadURL(authService.getAuthenticationURL(hasUsed, email), {
      userAgent: 'Chrome',
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

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

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
  const googleLogoutWindow = new BrowserWindow({ show: false });

  googleLogoutWindow.loadURL(authService.getGoogleLogOutUrl(), {
    userAgent: 'Chrome',
  });

  googleLogoutWindow.on('ready-to-show', () => {
    googleLogoutWindow.close();
  });

  const logoutWindow = new BrowserWindow({ show: false });

  logoutWindow.loadURL(authService.getLogOutUrl(), { userAgent: 'Chrome' });

  logoutWindow.on('ready-to-show', async () => {
    logoutWindow.close();
    await authService.logout();
  });
}

module.exports = {
  createAuthWindow,
  createLogoutWindow,
};
