export const AUTH_CONFIG = {
  domain: 'sil-transcriber-dev.auth0.com',
  clientId: '5wk1VBHB5tlEOeTcIV3xrEJ5ol9cNlTT',
  callbackUrl:
    process.env.REACT_APP_CALLBACK ||
    'https://admin-dev.siltranscriber.org/callback',
  loginApp: 'https://login-dev.siltranscriber.org',
};
