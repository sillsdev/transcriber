export const AUTH_CONFIG = {
  domain: 'languagetechnology.auth0.com',
  clientId: 'dfrC2w73KLoPv7u0yyl30cIJlirzOR3w',
  callbackUrl:
    process.env.REACT_APP_CALLBACK ||
    'https://admin-qa.siltranscriber.org/callback',
  loginApp: 'https://login-qa.siltranscriber.org',
};
