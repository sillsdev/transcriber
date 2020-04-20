export const isElectron = process.env.REACT_APP_MODE === 'electron';
const help =
  isElectron && process.env.REACT_APP_DESKTOP_HELP
    ? process.env.REACT_APP_DESKTOP_HELP
    : process.env.REACT_APP_HELP
    ? process.env.REACT_APP_HELP
    : '';

export const API_CONFIG = {
  host: process.env.REACT_APP_HOST ? process.env.REACT_APP_HOST : '',
  snagId: process.env.REACT_APP_SNAGID ? process.env.REACT_APP_SNAGID : '',
  offline:
    process.env.REACT_APP_OFFLINE === 'true' || process.env.NODE_ENV === 'test',
  help,
  adminHelp: process.env.REACT_APP_ADMIN_HELP
    ? process.env.REACT_APP_ADMIN_HELP
    : '',
  chmHelp: process.env.REACT_APP_CHM_HELP ? process.env.REACT_APP_CHM_HELP : '',
  community: process.env.REACT_APP_COMMUNITY
    ? process.env.REACT_APP_COMMUNITY
    : '',
  endpoint: process.env.REACT_APP_ENDPOINT
    ? process.env.REACT_APP_ENDPOINT
    : '',
};
