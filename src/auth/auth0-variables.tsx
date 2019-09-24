export const AUTH_CONFIG = {
  domain: process.env.REACT_APP_DOMAIN ? process.env.REACT_APP_DOMAIN : '',
  clientId: process.env.REACT_APP_CLIENTID
    ? process.env.REACT_APP_CLIENTID
    : '',
  callbackUrl: process.env.REACT_APP_CALLBACK
    ? process.env.REACT_APP_CALLBACK
    : '',
  loginApp: process.env.REACT_APP_LOGINAPP
    ? process.env.REACT_APP_LOGINAPP
    : '',
  myAccountApp: process.env.REACT_APP_MYACCOUNTAPP
    ? process.env.REACT_APP_MYACCOUNTAPP
    : '',
  newOrgApp: process.env.REACT_APP_NEWORGAPP
    ? process.env.REACT_APP_NEWORGAPP
    : '',
};
