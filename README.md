# open-CES

Open **C**urrency **E**xchange **S**ystem is a back-end solution for local currencies. The main features are:

- Currency Management
- Account Management
- Account Top Off
- Voucher Management
- Transfer / Exchange / claim voucher

For more detail look at our web site : http://open-ces.org/

## pre requisite

   ```bash
   npm install
   ```

 - postgres db
 - redis
 - node.js

## To run the server

Make sure to install depencencies : npm install

use :

    ```bash
    npm run dev
    ```
or :

```bash
   npm run start
   ```

to run the tests :

    ```bash
   npm run test
   ```

---

# Configuration file
An .env file is expected on the root of thhe project. Containing the following variables:
 - PORT=port number
 - ENVIRO=string for environement, a value of "PRD" refers to production
 - JWT_ACCESS_SECRET_KEY=Key for JWT Access token
 - ACCESS_TOKEN_DURATION=Duration in ms for the access token (5min = 300000)
 - JWT_REFRESH_SECRET_KEY=Key for JWT Refresh Token
 - REFRESH_TOKEN_DURATION=Duration in ms for refresh token (60min= 3600000)
 - TRUSTED_ISSUER=Name of the trusted Issuer (Open-CES)
 - REDIS_URL=URL to access redis cache
 - DATABASE_URL= URL to acces the database
 - EMAIL_PWD="your_email_password"
 - EMAIL_USER="your_email_user"
 - MOBILE_APP_VERSION="1.0.0"

## Database Config

Use a Postgress database

### For a new database

Install Postgress
Create an empty database
Run prisma command to generate the database

### To update database

Run prisma command : npx prisma migrate dev --name [name]

