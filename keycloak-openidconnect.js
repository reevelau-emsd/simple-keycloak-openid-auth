const axios = require("axios");
const jwt = require("jsonwebtoken");

const https = require("https");
const agent = new https.Agent();

/**
 * Constructs the login redirect URL for Keycloak's authorization endpoint.
 *
 * @param {string} keycloakServerUrl - The URL of the Keycloak server.
 * @param {string} realm - The Keycloak realm where the client is registered.
 * @param {string} clientId - The client ID of the application registered in the Keycloak realm.
 * @param {string} redirectUri - The URI to which the user will be redirected after a successful login.
 * @returns {string} - The URL to redirect the user's browser to for login.
 */
function getLoginRedirectUrl(
  keycloakServerUrl,
  realm,
  clientId,
  redirectUri
) {
  return (
    `${keycloakServerUrl}` +
    `/realms/${realm}` +
    `/protocol/openid-connect/auth?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&scope=openid%20EMSD_OpenID` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`
  );
}

/**
 * Exchanges an authorization code for tokens using Keycloak's token endpoint.
 *
 * @param {string} keycloakServerUrl - The URL of the Keycloak server.
 * @param {string} realm - The Keycloak realm where the client is registered.
 * @param {string} clientId - The client ID of the application registered in the Keycloak realm.
 * @param {string} clientSecret - The client secret of the application registered in the Keycloak realm.
 * @param {string} redirectUri - The redirect URI used in the initial authorization request.
 * @param {string} authCode - The authorization code received from the Keycloak authorization endpoint.
 * @returns {Promise<object>} - Resolves to an object containing the tokens and related information.
 * @throws {Error} - Throws an error if the token exchange fails.
 */
async function exchangeTokens(
  keycloakServerUrl,
  realm,
  clientId,
  clientSecret,
  redirectUri,
  authCode
) {
  try {
    let tokenResponse = await axios.post(
      `${keycloakServerUrl}/realms/${realm}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: authCode,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        httpsAgent: agent,
      }
    );

    return tokenResponse.data;
  } catch (error) {
    throw new Error(`Exchange token by code failed: ${error.message}`);
  }
}

/**
 * Verifies the access token and returns the decoded JSON object.
 * @param {string} keycloakServerUrl - The Keycloak server URL.
 * @param {string} realm - The Keycloak realm.
 * @param {string} clientId - The Keycloak client ID.
 * @param {string} accessToken - The access token to verify.
 * @returns {Promise<object>} - The decoded JSON object.
 */
async function verifyAccessToken(
  keycloakServerUrl,
  realm,
  clientId,
  accessToken
) {
  try {
    const certsResponse = await axios.get(
      `${keycloakServerUrl}/realms/${realm}/protocol/openid-connect/certs`,
      { httpsAgent: agent }
    );
    const certs = certsResponse.data.keys;

    const decodedHeader = jwt.decode(accessToken, { complete: true }).header;
    const key = certs.find((k) => k.kid === decodedHeader.kid);

    if (!key) {
      throw new Error("Public key not found for token.");
    }

    const publicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
    const verifiedToken = jwt.verify(accessToken, publicKey, {
      algorithms: ["RS256"],
      audience: "account",
    });

    return verifiedToken;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Refreshes the tokens using the refresh token.
 * @param {string} keycloakServerUrl - The Keycloak server URL.
 * @param {string} realm - The Keycloak realm.
 * @param {string} clientId - The Keycloak client ID.
 * @param {string} clientSecret - The Keycloak client secret.
 * @param {string} refreshToken - The refresh token.
 * @returns {Promise<string>} - The new access token.
 */
async function refreshTokens(
  keycloakServerUrl,
  realm,
  clientId,
  clientSecret,
  refreshToken
) {
  try {
    const tokenResponse = await axios.post(
      `${keycloakServerUrl}/realms/${realm}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        httpsAgent: agent,
      }
    );

    return tokenResponse.data;
  } catch (error) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

/**
 * Generates the logout URL for the user.
 * @param {string} keycloakServerUrl - The Keycloak server URL.
 * @param {string} realm - The Keycloak realm.
 * @param {string} clientId - The Keycloak client ID.
 * @param {string} idToken - The ID token.
 * @param {string} postLogoutRedirectUri - The URL to redirect to after logout.
 * @returns {string} - The logout URL.
 */
function getLogoutUrl(
  keycloakServerUrl,
  realm,
  clientId,
  idToken,
  postLogoutRedirectUri
) {
  return ( 
    `${keycloakServerUrl}` +
    `/realms/${realm}` +
    `/protocol/openid-connect/logout?` +
    `client_id=${clientId}` +
    `&id_token_hint=${idToken}` +
    `&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}` 
  );

}

module.exports = {
  getLoginRedirectUrl,
  exchangeTokens,
  verifyAccessToken,
  refreshTokens,
  getLogoutUrl,
};
