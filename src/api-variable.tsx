export const API_CONFIG = {
  // host: 'https://ukepgrpe6l.execute-api.us-east-2.amazonaws.com/qa',
  host: 'https://9u6wlhwuha.execute-api.us-east-2.amazonaws.com/dev',
  //host: 'https://localhost:44370',
  offline:
    process.env.REACT_APP_OFFLINE === 'true' || process.env.NODE_ENV === 'test',
  help: 'https://help.siltranscriber.org',
};
