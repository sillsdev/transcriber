const { app, Menu } = require('electron');
const path = require('path');
const { shell } = require('electron');

function appMenu() {
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
        // { role: 'reload' }, doesn't work with code auth
        // { role: 'forceReload' }, doesn't work with code auth
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
              path.join(execFolder(), 'help/Audio_Project_Manager_Help.chm')
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
}

module.exports = appMenu;
