const { app, ipcMain, BrowserWindow, Menu, MenuItem } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const appMenu = require('./app-menu');

let mainWindow;
let localString = { addToDict: 'Add to dictionary' };

// Conditionally include the dev tools installer to load React Dev Tools
// let installExtension, REACT_DEVELOPER_TOOLS;

// This doesn't seem to work with the latest version of electron
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

  // if (isDev) {
  //   console.log(REACT_DEVELOPER_TOOLS);
  //   installExtension(REACT_DEVELOPER_TOOLS)
  //     .then((name) => console.log(`Added Extension:  ${name}`))
  //     .catch((error) => console.log(`An error occurred: , ${error}`));
  // }
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
