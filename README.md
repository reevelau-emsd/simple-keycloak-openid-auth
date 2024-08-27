# Simple Keycloak OpenIDConnect Authentication

This application demonstrates how to authenticate users with Keycloak using the OpenID Connect protocol, without using the official Keycloak JavaScript client (keycloak.js). It includes login, logout, and token refresh functionality, with token information stored in cookies.

## Features

    - Login: Redirects users to Keycloak for authentication.
    - Logout: Logs out users from Keycloak and clears authentication cookies.
    - Token Refresh: Refreshes the access token using the refresh token.
    - Display User Information: Shows user information (e.g., display name) stored in cookies.

## Prerequisites

    - Node.js
    - Keycloak server
    - Docker (optional, for containerization)
  
## Setup

1. Clone the Repository:

```
git clone https://github.com/reevelau-emsd/simple-keycloak-openid-auth.git
cd simple-keycloak-openid-auth
```

2. Install Dependencies:

```
npm install
```

3. Create Environment Variables:
Create a ```.env``` file with the following content:

```
KEYCLOAK_SERVER_URL=https://keycloak.example.com/auth
KEYCLOAK_REALM=myrealm
KEYCLOAK_CLIENT_ID=myclient
KEYCLOAK_CLIENT_SECRET=myclientsecret
REDIRECT_URI=http://localhost:3000/callback
```

4. Directory Structure:

```
simple-keycloak-openid-auth/
├── public/
│   └── index.html
├── .dockerignore
├── .env
├── .gitignore
├── Dockerfile
├── README.md
├── keycloak-openidconnect.js
├── package.json
├── package-lock.json
└── server.js
```

## Running the Application

### Run with node
1. Start the Server:
```
node server.js
```

2. Open the Application:
Navigate to http://localhost:3000 in your browser.

### Run with Trusted CA Cert

1. Start the Server:
```
NODE_EXTRA_CA_CERTS=path/to/ca/certificates.pem node server.js
```

2. Open the Application:
Navigate to http://localhost:3000 in your browser.

```path/to/ca/certificates.pem``` should contain a chain of trusted CA cert.

### Run with cert validation disabled (for dev only!)

1. Start the Server:
```
NODE_TLS_REJECT_UNAUTHORIZED=0 node server.js
```

2. Open the Application:
Navigate to http://localhost:3000 in your browser.

[NODE_TLS_REJECT_UNAUTHORIZED=0](https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue); This makes TLS, and HTTPS by extension, insecure. The use of this environment variable is strongly discouraged.

### Run with docker (optional)
1. Build the image
```
docker build -t simple-keycloak-openid-auth:latest .
```

2. Run the container
```
docker run --rm --name simple-keycloak-openid-auth -p 3000:3000 --env-file .env simple-keycloak-openid-auth:latest
```


## Frontend (index.html)

    - Login Button: Redirects to Keycloak for authentication.
    - Logout Button: Logs out the user and clears cookies.
    - Refresh Token Button: Refreshes the access token using the refresh token.
    - User Information: Displays user information from cookies if available.

## Backend (server.js)
### Routes

    - /login: Redirects to Keycloak login page.
    - /callback: Handles the Keycloak callback, verifies the access token, sets cookies, and redirects to the index page.
    - /logout: Clears cookies and redirects to Keycloak logout URL.
    - /refresh-token: Refreshes the access token using the refresh token and updates cookies.

### Helper Function

    - setTokenCookies(res, tokens): Sets cookies with expiration times based on the access token's expiration time.

### Cookie Management

    - Access Token Cookie: Expires with the access token.
    - Refresh Token Cookie: Expires with the refresh token.
    - ID Token Cookie: Expires with the access token.
    - User Information Cookies: Expires with the access token.

