import { User } from '@auth0/auth0-react';

export default class Auth {
  accessToken: any;
  profile: any;
  expiresAt: any;
  email_verified: boolean;

  constructor() {
    this.logout = this.logout.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.email_verified = false;
  }

  getAccessToken() {
    return this.accessToken;
  }

  getProfile() {
    return this.profile;
  }

  setDesktopSession(
    idTokenPayload: User | undefined,
    accessToken: string,
    expire?: number
  ) {
    // Set the time that the access token will expire at
    this.accessToken = accessToken;
    this.profile = idTokenPayload;
    this.expiresAt = expire || accessToken ? new Date(5000, 0, 0) : null;
    this.email_verified = this.profile?.email_verified;
    localStorage.setItem('isLoggedIn', 'true');
  }

  emailVerified() {
    return this.email_verified;
  }

  logout() {
    // Remove tokens and expiry time
    this.accessToken = null;
    this.profile = null;
    this.expiresAt = 0;

    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    if (!this.email_verified) return false;
    let expiresAt = this.expiresAt;
    return new Date().getTime() < expiresAt;
  }
}
