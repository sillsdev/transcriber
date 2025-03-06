const { app, systemPreferences, shell } = require('electron');

const createAppWindow = require('./app-process');
const fileReadProtocol = require('./file-read-protocol');
const ipcMethods = require('./ipcMethods');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// https://www.bigbinary.com/blog/request-camera-micophone-permission-electron
const checkMicrophonePermission = async () => {
  const hasMicrophonePermission =
    systemPreferences.getMediaAccessStatus('microphone') === 'granted';
  if (hasMicrophonePermission) return;
  if (process.platform === 'darwin') {
    const microPhoneGranted = await systemPreferences.askForMediaAccess(
      'microphone'
    );
    if (!microPhoneGranted) {
      shell.openExternal(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'
      );
    }
  } else if (process.platform === 'win32') {
    shell.openExternal('ms-settings:privacy-microphone');
  }
};

async function showWindow() {
  checkMicrophonePermission();
  fileReadProtocol();
  return createAppWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', showWindow);

ipcMethods();
