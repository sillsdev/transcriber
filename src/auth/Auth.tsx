import history from '../history';
import auth0 from 'auth0-js';
import { AUTH_CONFIG } from './auth0-variables';
import { API_CONFIG } from '../api-variable';

export default class Auth {
  accessToken: any;
  idToken: any;
  expiresAt: any;

  auth0 = new auth0.WebAuth({
    domain: AUTH_CONFIG.domain,
    clientID: AUTH_CONFIG.clientId,
    redirectUri: AUTH_CONFIG.callbackUrl,
    responseType: 'token id_token',
    scope: 'openid email',
    audience: 'https://transcriber_api',
  });

  constructor() {
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.getIdToken = this.getIdToken.bind(this);
    this.renewSession = this.renewSession.bind(this);
  }

  login() {
    this.auth0.authorize({
      language: navigator.language.split('-')[0],
    });
  }

  signup() {
    this.auth0.authorize({
      mode: 'signUp',
      language: navigator.language.split('-')[0],
    });
  }

  handleAuthentication() {
    return new Promise((resolve, reject) => {
      const nonce = 'test';
      this.auth0.parseHash(
        { nonce: nonce, state: 'tAdInit' },
        (err, authResult) => {
          if (err) return reject(err);
          if (!authResult || !authResult.idTokenPayload) {
            reject(err);
          }
          this.setSession(authResult);
          resolve();
        }
      );
    });
  }

  getAccessToken() {
    return this.accessToken;
  }

  getIdToken() {
    return this.idToken;
  }

  setSession(authResult: any) {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');

    // Set the time that the access token will expire at
    let expiresAt = authResult.expiresIn * 1000 + new Date().getTime();
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    this.expiresAt = expiresAt;

    // navigate to the home route
    history.replace('/loading');
  }

  renewSession() {
    return new Promise((resolve, reject) => {
      this.auth0.checkSession({}, (err, authResult) => {
        if (err) return reject(err);
        this.setSession(authResult);
        resolve();
      });
    });
  }

  logout() {
    // Remove tokens and expiry time
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = 0;

    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('nonce');
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-id');

    this.auth0.logout({
      returnTo: window.location.origin,
    });

    // navigate to the home route
    history.replace('/loading');
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    if (API_CONFIG.offline) {
      return true;
    }
    let expiresAt = this.expiresAt;
    return new Date().getTime() < expiresAt;
  }
}
