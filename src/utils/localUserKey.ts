import { isElectron } from '../api-variable';

export enum LocalKey {
  time = 'lastTime', //datachanges last done
  url = 'fromUrl', //last place specific user was so we can go back there
  deeplink = 'deeplink', //specific path was requested in browser url - we may not know the user.  Do NOT use LocalUserKey with deeplink
  start = 'startNext', //in progress mediadownload
  passage = 'passage',
  compare = 'compare',
  personalOrgs = 'persOrgs',
  /* Documentation for localStorage keys */
  home = 'home', // set to home folder for dataPath (to avoid async)
  connected = 'connected', // true if we're connected (used for error reporting)
  errorLog = 'errorLog', // current error log file name
  authId = 'auth-id', // current auth identity
  inviteId = 'inviteId', // id of invitation
  inviteError = 'inviteError', // save error we had while accepting invite
  userId = 'user-id', // guid for current user
  onlineUserId = 'online-user-id', // user id last time we went online"
  goingOnline = 'goingOnline', // reloading and going online
  loggedIn = 'isLoggedIn', // true if logged in
  offlineAdmin = 'offlineAdmin', // allow admin functions because offline only
  developer = 'developer', // enable developer features
  updates = 'updates', // set to false to turn of update checking
  template = 'template', // track latest file template for bulk uploads
  autoaddProject = 'autoaddProject',
  staticTables = 'static-tables', // last static table version
  lastProj = 'lastProj', // most recent project used
}

export const localUserKey = (id: LocalKey) => {
  var userId = '';
  switch (id) {
    case LocalKey.time:
      if (isElectron) userId = 'electron';
      break;
    case LocalKey.deeplink:
      userId = 'DO NOT USE LOCALUSER';
  }
  if (!userId)
    userId =
      localStorage.getItem(LocalKey.userId) ||
      localStorage.getItem(LocalKey.onlineUserId) ||
      '';
  return `${userId}-${id}`;
};
