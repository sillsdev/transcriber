const envVariables = require('./auth0-variables');
const {
  app,
  ipcMain,
  BrowserWindow,
  session,
  Menu,
  MenuItem,
} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const appMenu = require('./app-menu');
const { auth0Domain, authProviders } = envVariables;

let mainWindow;
let localString = { addToDict: 'Add to dictionary' };

// Conditionally include the dev tools installer to load React Dev Tools
// let installExtension, REACT_DEVELOPER_TOOLS;

// if (isDev) {
//   const devTools = require('electron-devtools-installer');
//   installExtension = devTools.default;
//   REACT_DEVELOPER_TOOLS = devTools.REACT_DEVELOPER_TOOLS;
// }

function createAppWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 768,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      devTools: true, // isDev,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      enableRemoteModule: false,
      contextIsolation: true,
      webSecurity: false,
      spellcheck: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  appMenu();

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`,
    { userAgent: 'Chrome' }
  );

  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Add each spelling suggestion
    const addSuggestion = (suggestion) => () =>
      mainWindow.webContents.replaceMisspelling(suggestion);
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: addSuggestion(suggestion),
        })
      );
    }

    // Allow users to add the misspelled word to the dictionary
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: localString.addToDict,
          click: () =>
            mainWindow.webContents.session.addWordToSpellCheckerDictionary(
              params.misspelledWord
            ),
        })
      );
    }

    if (params.misspelledWord) menu.popup();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

ipcMain.handle('setAddToDict', async (event, str) => {
  localString.addToDict = str;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createAppWindow();
  }

  if (isDev) {
    // https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy
    // https://github.com/reZach/secure-electron-template/issues/14
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            `base-uri 'self' https://${auth0Domain} ${authProviders}`,
            "object-src 'none'",
            `script-src 'unsafe-inline' 'self' ${authProviders}`, //'nonce-tVZvi9VxJuouaojo+5nChg=='
            `style-src 'unsafe-inline' 'self' https://fonts.googleapis.com ${authProviders}`,
            "frame-src 'none'",
            "worker-src 'self'",
          ],
        },
      });
    });

    // installExtension(REACT_DEVELOPER_TOOLS)
    //   .then((name) => console.log(`Added Extension:  ${name}`))
    //   .catch((error) => console.log(`An error occurred: , ${error}`));
  } else {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            `base-uri 'self' https://${auth0Domain} ${authProviders}`,
            "object-src 'none'",
            `script-src 'unsafe-inline' 'self' ${authProviders}`, //'nonce-tVZvi9VxJuouaojo+5nChg=='
            `style-src 'unsafe-inline' 'self' https://fonts.googleapis.com ${authProviders}`,
            "frame-src 'none'",
            "worker-src 'self'",
          ],
        },
      });
    });
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createAppWindow();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// WARNING: This code causes crashes during authentication!
// app.on('window-all-closed', () => {
//   console.log(`app all closed`);
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

module.exports = createAppWindow;
