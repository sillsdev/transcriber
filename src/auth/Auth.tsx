import history from '../history';
import auth0 from 'auth0-js';
import jwtDecode from 'jwt-decode';
import { isElectron } from '../api-variable';
import {
  apiIdentifier,
  auth0Domain,
  webClientId,
} from './auth0-variables.json';
import { localeDefault } from '../utils';

export default class Auth {
  accessToken: any;
  profile: any;
  expiresAt: any;
  email_verified: boolean;

  auth0 = new auth0.WebAuth({
    domain: auth0Domain,
    clientID: webClientId,
    redirectUri: process.env.REACT_APP_CALLBACK,
    responseType: 'token id_token',
    scope: 'openid email profile',
    audience: apiIdentifier,
    leeway: 300,
  });

  constructor() {
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.renewSession = this.renewSession.bind(this);
    this.email_verified = false;
  }

  login() {
    this.auth0.authorize({
      language: localeDefault(false, navigator.language.split('-')[0]),
    });
  }

  signup() {
    this.auth0.authorize({
      mode: 'signUp',
      language: localeDefault(false, navigator.language.split('-')[0]),
    });
  }

  handleAuthentication() {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
      } else if (err) {
        history.replace('/');
        console.log(err);
        if (err.error !== 'invalid_token')
          throw new Error(
            `Error: ${err.error}. Check the console for further details.`
          );
      }
    });
  }

  getAccessToken() {
    return this.accessToken;
  }

  getProfile() {
    return this.profile;
  }

  setSession(authResult: any) {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');

    // Set the time that the access token will expire at
    let expiresAt = authResult.expiresIn * 1000 + new Date().getTime();
    this.accessToken = authResult.accessToken;
    this.profile = authResult.idTokenPayload;
    // console.log(Base64.decode(authResult.idToken));
    // console.log(jwtDecode(authResult.idToken));
    this.expiresAt = expiresAt;
    this.email_verified = authResult.idTokenPayload.email_verified;

    // navigate to the home route
    if (this.email_verified) history.replace('/loading');
    else history.replace('/emailunverified');
  }

  setDesktopSession(idTokenPayload: any, accessToken: any) {
    // Set the time that the access token will expire at
    this.accessToken = accessToken;
    this.profile = idTokenPayload;
    this.expiresAt = accessToken ? new Date(5000, 0, 0) : null;
    this.email_verified = this.profile?.email_verified;
    if (!this.email_verified) {
      const decodedToken: any = jwtDecode(accessToken);
      const verifiedKey = Object.keys(decodedToken).filter(
        (n) => n.indexOf('email_verified') !== -1
      );
      if (verifiedKey.length > 0)
        this.email_verified = decodedToken[verifiedKey[0]];
    }
  }

  emailVerified() {
    return this.email_verified;
  }

  renewSession() {
    return new Promise((resolve, reject) => {
      this.auth0.checkSession({}, (err, authResult) => {
        if (err) return reject(err);
        this.setSession(authResult);
        resolve({});
      });
    });
  }

  logout() {
    // Remove tokens and expiry time
    this.accessToken = null;
    this.profile = null;
    this.expiresAt = 0;

    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('nonce');

    if (!isElectron)
      this.auth0.logout({
        returnTo: window.location.origin,
      });

    // navigate to the home route
    // history.replace('/loading');
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    if (!this.email_verified) return false;
    let expiresAt = this.expiresAt;
    return new Date().getTime() < expiresAt;
  }
}
