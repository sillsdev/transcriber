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
};
