const { app, BrowserWindow, Menu, MenuItem, session } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { shell } = require('electron');
require('@electron/remote/main').initialize();

let mainWindow;

function createAppWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 768,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      spellcheck: true,
    },
  });

  const isMac = process.platform === 'darwin';
  const execFolder = () =>
    path.dirname(
      process.helperExecPath.replace(
        path.join('node_modules', 'electron', 'dist'),
        path.join('dist', 'win-unpacked')
      )
    );

  var menu = Menu.buildFromTemplate([
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        // { type: 'separator' },
        // { role: 'resetZoom' },
        // { role: 'zoomIn' },
        // { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => {
            shell.openPath(
              path.join(execFolder(), 'help/SIL_Transcriber_Help.chm')
            );
          },
        },
        {
          label: 'Community Support',
          click: () => {
            shell.openExternal(
              'https://community.scripture.software.sil.org/c/transcriber'
            );
          },
        },
        {
          label: 'Web Site',
          click: () => {
            shell.openExternal('https://software.sil.org/siltranscriber');
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Add each spelling suggestion
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: () =>
            event.mainWindow.webContents.replaceMisspelling(suggestion),
        })
      );
    }

    // Allow users to add the misspelled word to the dictionary
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () =>
            event.mainWindow.webContents.session.addWordToSpellCheckerDictionary(
              params.misspelledWord
            ),
        })
      );
    }

    menu.popup();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  console.log(`session=`, JSON.stringify(session.defaultSession, null, 2));

  session.defaultSession.on(
    'preconnect',
    (event, preconnectUrl, allowCredentials) => {
      console.log(`preconnect=${preconnectUrl}`);
    }
  );

  session.defaultSession.on(
    'spellcheck-dictionary-initialized',
    (event, languageCode) => {
      console.log(`dictionary init=${languageCode}`);
    }
  );

  session.defaultSession.on(
    'spellcheck-dictionary-download-begin',
    (event, languageCode) => {
      console.log(`dictionary download begin=${languageCode}`);
    }
  );

  session.defaultSession.on(
    'spellcheck-dictionary-download-success',
    (event, languageCode) => {
      console.log(`dictionary downloaded=${languageCode}`);
    }
  );

  session.defaultSession.on(
    'spellcheck-dictionary-download-failure',
    (event, languageCode) => {
      console.log(`dictionary download fail=${languageCode}`);
    }
  );

  console.log(
    `available spelling`,
    session.defaultSession.availableSpellCheckerLanguages
  );
  session.defaultSession.setSpellCheckerLanguages(['en-US', 'fr']);

  mainWindow.on('closed', () => (mainWindow = null));
}

module.exports = createAppWindow;
