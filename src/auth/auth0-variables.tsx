export const AUTH_CONFIG = {
  domain: process.env.REACT_APP_DOMAIN || '',
  clientId: process.env.REACT_APP_CLIENTID || '',
  callbackUrl: process.env.REACT_APP_CALLBACK || '',
  apiIdentifier: process.env.REACT_APP_AUDIENCE || '',
  desktopId: process.env.REACT_APP_DESKTOPID || '',
};
