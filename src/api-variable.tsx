export const isElectron = (window as any)?.electron;
const help =
  isElectron && process.env.REACT_APP_DESKTOP_HELP
    ? process.env.REACT_APP_DESKTOP_HELP
    : process.env.REACT_APP_HELP
    ? process.env.REACT_APP_HELP
    : '';

export const OrbitNetworkErrorRetries = 5;

export const API_CONFIG = {
  host: process.env.REACT_APP_HOST ? process.env.REACT_APP_HOST : '',
  snagId: process.env.REACT_APP_SNAGID ? process.env.REACT_APP_SNAGID : '',
  offline:
    process.env.REACT_APP_OFFLINE === 'true' || process.env.NODE_ENV === 'test',
  help,
  chmHelp: process.env.REACT_APP_CHM_HELP ? process.env.REACT_APP_CHM_HELP : '',
  community: process.env.REACT_APP_COMMUNITY
    ? process.env.REACT_APP_COMMUNITY
    : '',
  openNotes: process.env.REACT_APP_OPENNOTES
    ? process.env.REACT_APP_OPENNOTES
    : '',
  resources: process.env.REACT_APP_RESOURCES
    ? process.env.REACT_APP_RESOURCES
    : '',
  openContent: process.env.REACT_APP_OPENCONTENT
    ? process.env.REACT_APP_OPENCONTENT
    : '',
  course: process.env.REACT_APP_COURSE ? process.env.REACT_APP_COURSE : '',
  videoTraining: process.env.REACT_APP_VIDEO_TRAINING
    ? process.env.REACT_APP_VIDEO_TRAINING
    : '',
  walkThru: process.env.REACT_APP_WALK_THRU
    ? process.env.REACT_APP_WALK_THRU
    : '',
  akuo: process.env.REACT_APP_AKUO ? process.env.REACT_APP_AKUO : '',
  endpoint: process.env.REACT_APP_ENDPOINT
    ? process.env.REACT_APP_ENDPOINT
    : '',
  productName:
    (process.env.REACT_APP_SITE_TITLE
      ? process.env.REACT_APP_SITE_TITLE
      : 'Audio Project Manager') + (isElectron ? ' Desktop' : ''),
  flatSample: process.env.REACT_APP_FLAT ? process.env.REACT_APP_FLAT : '',
  hierarchicalSample: process.env.REACT_APP_HIERARCHICAL
    ? process.env.REACT_APP_HIERARCHICAL
    : '',
  genFlatSample: process.env.REACT_APP_GEN_FLAT
    ? process.env.REACT_APP_GEN_FLAT
    : '',
  genHierarchicalSample: process.env.REACT_APP_GEN_HIERARCHICAL
    ? process.env.REACT_APP_GEN_HIERARCHICAL
    : '',
  googleSamples: process.env.REACT_APP_GOOGLE_SAMPLES
    ? process.env.REACT_APP_GOOGLE_SAMPLES
    : '',
  sizeLimit: process.env.REACT_APP_SIZELIMIT
    ? process.env.REACT_APP_SIZELIMIT
    : '20',
  sessions: process.env.REACT_APP_SESSIONS
    ? process.env.REACT_APP_SESSIONS
    : 'https://sessions.bugsnag.com',
  notify: process.env.REACT_APP_NOTIFY
    ? process.env.REACT_APP_NOTIFY
    : 'https://notify.bugsnag.com',
};
