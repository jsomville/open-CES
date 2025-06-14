# open-CES

Open **C**urrency **E**xchange **S**ystem is a back-end solution for local currencies. The main features are:

- Currency Management
- Account Management
- Account Top Off
- Transfer / Exchange
- Voucher Management
- Claim Voucher

For more detail look at our web site : http://open-ces.org/

# To run the server

use :

    npm run dev

or :

    npm run start

to run the tests :

    npm run test

---

# Configuration

All configuration can be find in a .env file
The following variables are expected:

- PORT : port number
- ENVIRO : string for environement, a value of "PRD" refers to production
- JWT_ACCESS_SECRET_KEY : Key for JWT Access token
- ACCESS_TOKEN_DURATION : Duration in ms for the access token
- JWT_REFRESH_SECRET_KEY : Key for JWT Refresh Token
- REFRESH_TOKEN_DURATION : Duration in ms for refresh token
- TRUSTED_ISSUER : Name of the trusted Issuer

## Database Config

TBD
