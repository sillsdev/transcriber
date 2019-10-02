export const API_CONFIG = {
  // host: 'https://ukepgrpe6l.execute-api.us-east-2.amazonaws.com/qa',
  // host: 'https://9u6wlhwuha.execute-api.us-east-2.amazonaws.com/dev',
  host: process.env.REACT_APP_HOST ? process.env.REACT_APP_HOST : '',
  //host: 'https://localhost:44370',
  offline:
    process.env.REACT_APP_OFFLINE === 'true' || process.env.NODE_ENV === 'test',
  help: process.env.REACT_APP_HELP ? process.env.REACT_APP_HELP : '',
  community: process.env.REACT_APP_COMMUNITY
    ? process.env.REACT_APP_COMMUNITY
    : '',
  isApp: process.env.REACT_APP_APPMODE
    ? process.env.REACT_APP_APPMODE === 'true'
    : false,
};
