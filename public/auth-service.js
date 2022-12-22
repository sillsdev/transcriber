const envVariables = require('./auth0-variables');
const jwtDecode = require('jwt-decode');
const axios = require('axios');
const https = require('https');
const url = require('url');
const keytar = require('keytar');
const os = require('os');

const redirectUri = 'http://localhost/callback';

const keytarService = 'electron-openid-oauth';
const keytarAccount = os.userInfo().username;
const { apiIdentifier, auth0Domain, desktopId } = envVariables;

let accessToken = null;
let profile = null;
let refreshToken = null;

function getAccessToken() {
  return accessToken;
}

function getProfile() {
  return profile;
}

function getAuthenticationURL(hasUsed, email) {
  const dev = envVariables.auth0Domain.indexOf('-dev') > 0;
  return (
    `https://${auth0Domain}/authorize?` +
    `audience=${apiIdentifier}&` +
    'scope=openid email profile offline_access&' +
    'response_type=code&' +
    (!hasUsed && dev
      ? 'login_hint=signUp&'
      : !hasUsed && !dev
      ? 'mode=signUp&'
      : hasUsed && email
      ? `login_hint=${encodeURIComponent(email)}&`
      : '') +
    `client_id=${desktopId}&` +
    `redirect_uri=${redirectUri}`
  );
}

// TODO: Remove httpsAgent once the Auth0 root certificates are registered
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function refreshTokens() {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

  if (refreshToken) {
    const refreshOptions = {
      method: 'POST',
      url: `https://${auth0Domain}/oauth/token`,
      headers: {
        'content-type': 'application/json',
        'Accept-Encoding': 'text/html; charset=UTF-8',
      },
      data: {
        grant_type: 'refresh_token',
        client_id: desktopId,
        refresh_token: refreshToken,
      },
      timeout: 5000,
      httpsAgent,
    };

    try {
      const response = await axios(refreshOptions);

      accessToken = response.data.access_token;
      profile = jwtDecode(response.data.id_token);
    } catch (error) {
      await logout();

      throw error;
    }
  } else {
    throw new Error('No available refresh token.');
  }
}

async function loadTokens(callbackURL) {
  const urlParts = url.parse(callbackURL, true);
  const query = urlParts.query;

  const exchangeOptions = {
    grant_type: 'authorization_code',
    client_id: desktopId,
    code: query.code,
    redirect_uri: redirectUri,
  };

  const options = {
    method: 'POST',
    url: `https://${auth0Domain}/oauth/token`,
    headers: {
      'content-type': 'application/json',
      'Accept-Encoding': 'text/html; charset=UTF-8',
    },
    data: JSON.stringify(exchangeOptions),
    httpsAgent,
  };

  try {
    const response = await axios(options);

    accessToken = response.data.access_token;
    profile = jwtDecode(response.data.id_token);
    refreshToken = response.data.refresh_token;

    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (error) {
    await logout();

    throw error;
  }
}

async function logout() {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  profile = null;
  refreshToken = null;
}

function getLogOutUrl() {
  return `https://${auth0Domain}/v2/logout`;
}

function getGoogleLogOutUrl() {
  return `https://accounts.google.com/Logout`;
}

module.exports = {
  getAccessToken,
  getAuthenticationURL,
  getLogOutUrl,
  getGoogleLogOutUrl,
  getProfile,
  loadTokens,
  logout,
  refreshTokens,
};
