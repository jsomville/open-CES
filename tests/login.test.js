import assert from "node:assert";
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from "../app.js";
//import config from "./config.test.js";
import { setActiveUser, setPhoneValidated, setEmailValidated, getUserByEmail, addUser, removeUser } from "../services/user_service.js";

describe("Login Test", () => {
  const okUser = {
    email: "ok_user@open-ces.org",
    password: "Abcd1234efgh!",
    phone: "1113465987",
  }
  const okAdmin = {
    email: "ok_admin@open-ces.org",
    password: "Abcd1234efgh!",
    phone: "2113465987",
  }
  const notValidatedUser = {
    email: "unvalidated@open-ces.org",
    password: "Abcd1234efgh!",
    phone: "312523465987",
  };
  const noPhoneUser = {
    email: "no_phone@open-ces.org",
    password: "Abcd1234efgh!",
    phone: "462523465987",
  };
  const noEmailUser = {
    email: "no_email@open-ces.org",
    password: "Abcd1234efgh!",
    phone: "5125234999987",
  };

  let validAccessToken = ""
  let validRefreshToken = ""

  before(async () => {
    try {
      let userTemp;

      //Check and create for validated user
      userTemp = await getUserByEmail(okUser.email);
      if (!userTemp) {
        const user = await addUser(okUser.email, okUser.phone, okUser.password);

        await setActiveUser(user.id);
        await setEmailValidated(user.id);
        await setPhoneValidated(user.id);
      }

      //Check and create for validated admin
      userTemp = await getUserByEmail(okAdmin.email);
      if (!userTemp) {
        const user = await addUser(okAdmin.email, okAdmin.phone, okAdmin.password, "admin");

        await setActiveUser(user.id);
        await setEmailValidated(user.id);
        await setPhoneValidated(user.id);
      }

      //Check and create for not activated user
      userTemp = await getUserByEmail(notValidatedUser.email);
      if (!userTemp) {
        const user = await addUser(notValidatedUser.email, notValidatedUser.phone, notValidatedUser.password);
        //await setActiveUser(user.id);
        await setEmailValidated(user.id);
        await setPhoneValidated(user.id);
      }

      //Check and create for no Phone
      userTemp = await getUserByEmail(noPhoneUser.email);
      if (!userTemp) {
        const user = await addUser(noPhoneUser.email, noPhoneUser.phone, noPhoneUser.password);
        await setActiveUser(user.id);
        await setEmailValidated(user.id);
        //await setPhoneValidated(user.id);
      }

      //Check and create for no validated Email
      userTemp = await getUserByEmail(noEmailUser.email);
      if (!userTemp) {
        const user = await addUser(noEmailUser.email, noEmailUser.phone, noEmailUser.password);
        await setActiveUser(user.id);
        //await setEmailValidated(user.id);
        await setPhoneValidated(user.id);
      }
    }
    catch (error) {
      console.error(error);
    }

  });

  after(async () => {
    try {
      let userTemp;
      userTemp = await getUserByEmail(okUser.email);
      await removeUser(userTemp.id);

      userTemp = await getUserByEmail(okAdmin.email);
      await removeUser(userTemp.id);

      userTemp = await getUserByEmail(notValidatedUser.email);
      await removeUser(userTemp.id);

      userTemp = await getUserByEmail(noPhoneUser.email);
      await removeUser(userTemp.id);

      userTemp = await getUserByEmail(noEmailUser.email);
      await removeUser(userTemp.id);
    }
    catch (error) {
      console.error(error);
    }

  });

  /****************************************** */
  // Login
  /****************************************** */

  it('Login - User not found', async () => {
    const payload = {
      "username": "a@b.com",
      "password": "Aa123456!"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, "Invalid username or password");
  });

  it('Login - Invalid Credentials', async () => {
    const payload = {
      "username": okUser.email,
      "password": "Aa123456!"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, "Invalid username or password");
  });

  it('Login - Missing Username', async () => {
    const payload = {
      //"username": okUser.email,
      "password": "Aa123456!"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
  });

  it('Login - Missing Password', async () => {
    const payload = {
      "username": okUser.email,
      //"password": "ggg"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
  });


  // Check a normal user can login
  it('Login - User', async () => {
    const payload = {
      "username": okUser.email,
      "password": okUser.password,
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);

    // Access Token 
    const decoded_access_token = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET_KEY);
    assert.equal(decoded_access_token.sub, payload.username);
    assert.equal(decoded_access_token.role, "user");
    assert.equal(decoded_access_token.aud, "OpenCES");
    assert.equal(decoded_access_token.iss, "Open-CES");
    assert.ok(decoded_access_token.iat);
    assert.ok(decoded_access_token.exp);

    //Refresh Token
    const decoded_refresh_token = jwt.verify(res.body.refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
    assert.equal(decoded_refresh_token.aud, "OpenCES");
    assert.equal(decoded_refresh_token.iss, "Open-CES");
    assert.ok(decoded_refresh_token.iat);
    assert.ok(decoded_refresh_token.exp);

    validAccessToken = res.body.accessToken;
    validRefreshToken = res.body.refreshToken;
  });

  it('Login - Admin', async () => {
    const payload = {
      "username": okAdmin.email,
      "password": okAdmin.password
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);

    // Access Token
    const decoded_access_token = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET_KEY);
    assert.equal(decoded_access_token.sub, payload.username);
    assert.equal(decoded_access_token.role, "admin");
    assert.equal(decoded_access_token.aud, "OpenCES");
    assert.equal(decoded_access_token.iss, "Open-CES");
    assert.ok(decoded_access_token.iat);
    assert.ok(decoded_access_token.exp);

    // Refresh Token
    const decoded_refresh_token = jwt.verify(res.body.refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
    assert.equal(decoded_refresh_token.aud, "OpenCES");
    assert.equal(decoded_refresh_token.iss, "Open-CES");
    assert.ok(decoded_refresh_token.iat);
    assert.ok(decoded_refresh_token.exp);
  });

  it('Login - Inactive User', async () => {
    const payload = {
      "username": notValidatedUser.email,
      "password": notValidatedUser.password,
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "Forbidden");
  });

  /****************************************** */
  // Refresh
  /****************************************** */

  it('Refresh', async () => {
    const res = await request(app)
        .post('/api/idp/refresh')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ "refreshToken": validRefreshToken });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.accessToken);

    validAccessToken = res.body.accessToken;
  });


  it('Refresh - returns 400 when refreshToken is missing', async () => {
      const res = await request(app)
          .post('/api/idp/refresh')
          .send({});

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.message, 'Validation failed');
  });

  it('Refresh - returns 500 for malformed refresh token', async () => {
      const res = await request(app)
          .post('/api/idp/refresh')
          .send({ refreshToken: 'not-a-valid-jwt' });

      assert.strictEqual(res.statusCode, 500);
      assert.ok(res.body.error);
  });

  /****************************************** */
  // Logout
  /****************************************** */
  
  it('Logout', async () => {
    const res = await request(app)
        .post('/api/idp/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send();

    assert.strictEqual(res.statusCode, 200);
  });

  it('Logout - no token', async () => {
      const res = await request(app)
          .post('/api/idp/logout')
          .set('Authorization', `Bearer`)
          .send({});

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.message, 'Invalid token');
  });
});
