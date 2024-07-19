const express = require('express');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { getLoginRedirectUrl, exchangeTokens, verifyAccessToken, refreshTokens, getLogoutUrl } = require('./keycloak-openidconnect');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const {
  KEYCLOAK_SERVER_URL,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  REDIRECT_URI,
} = process.env;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to initiate login
app.get('/login', (req, res) => {
  const authUrl = getLoginRedirectUrl(KEYCLOAK_SERVER_URL,KEYCLOAK_REALM,KEYCLOAK_CLIENT_ID, REDIRECT_URI);
  res.redirect(authUrl);
});

// Callback route
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.redirect('/');
  }

  try {
    const tokens = await exchangeTokens(KEYCLOAK_SERVER_URL,KEYCLOAK_REALM,KEYCLOAK_CLIENT_ID,KEYCLOAK_CLIENT_SECRET,REDIRECT_URI,code);
    
    let jwt = await verifyAccessToken(KEYCLOAK_SERVER_URL, KEYCLOAK_REALM,KEYCLOAK_CLIENT_ID, tokens.access_token);
    const expiresIn = jwt.exp - Math.floor(Date.now() / 1000);

    res.cookie('access_token', tokens.access_token, {httpOnly: true, maxAge: expiresIn * 1000 });
    res.cookie('refresh_token', tokens.refresh_token, {httpOnly:true, maxAge: expiresIn * 1000 });
    res.cookie('id_token', tokens.id_token, {httpOnly: true, maxAge: expiresIn * 1000 });
    res.cookie('display_name', jwt.display_name, { maxAge: expiresIn * 1000 });

    res.redirect('/');
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Failed to exchange code for token');
  }
});

// Refresh token route
app.get('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(400).send('No refresh token found');
  }

  try {
    const tokens = await refreshTokens(KEYCLOAK_SERVER_URL,KEYCLOAK_REALM,KEYCLOAK_CLIENT_ID,KEYCLOAK_CLIENT_SECRET,refreshToken)

    let jwt = await verifyAccessToken(KEYCLOAK_SERVER_URL, KEYCLOAK_REALM,KEYCLOAK_CLIENT_ID, tokens.access_token);
    const expiresIn = jwt.exp - Math.floor(Date.now() / 1000);

    // Update the tokens as cookies
    res.cookie('access_token', tokens.access_token, { httpOnly: true, maxAge: expiresIn * 1000 });
    res.cookie('refresh_token', tokens.refresh_token, { httpOnly: true, maxAge: expiresIn * 1000 });
    res.cookie('id_token', tokens.id_token, { httpOnly: true, maxAge: expiresIn * 1000 });
    res.cookie('display_name', jwt.display_name, { maxAge: expiresIn * 1000 });

    res.json({ message: 'Access token refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    res.status(500).send('Failed to refresh access token');
  }
});


// Logout route
app.get('/logout', (req, res) => {
  const idToken = req.cookies.id_token;
  const logoutUrl = getLogoutUrl(KEYCLOAK_SERVER_URL,KEYCLOAK_REALM,KEYCLOAK_CLIENT_ID,idToken,REDIRECT_URI);

  // Clear cookies
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('id_token');
  res.clearCookie('display_name');
  
  // Redirect to Keycloak logout URL
  res.redirect(logoutUrl);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server running on port ${PORT}`);
});

