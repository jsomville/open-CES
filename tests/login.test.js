import assert from "node:assert";
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from "../app.js";
import config from "./config.test.js";
import { setActiveUser, setPhoneValidated, setEmailValidated, getUserByEmail, addUser, removeUser } from "../services/user_service.js"
import { reset_rate_limiter_by_ip, reset_rate_limiter_by_sub } from "../middleware/rate-limiter.js";

describe("Login Test", () => {
  const okUser = {
    email: "ok_user@open-ces.org",
    password: "abcd1234efgh!",
    phone: "1113465987",
  }
  const okAdmin = {
    email: "ok_admin@open-ces.org",
    password: "abcd1234efgh!",
    phone: "2113465987",
  }
  const unvalidatedUser = {
    email: "unvalidated@open-ces.org",
    password: "abcd1234efgh!",
    phone: "312523465987",
  };
  const noPhoneUser = {
    email: "no_phone@open-ces.org",
    password: "abcd1234efgh!",
    phone: "462523465987",
  };
  const noEmailUser = {
    email: "no_email@open-ces.org",
    password: "abcd1234efgh!",
    phone: "5125234999987",
  };

  before(async () => {
    try {
      let userTemp;

      //Check and create for un-validated user
      userTemp = await getUserByEmail(okUser.email);
      if (!userTemp) {
        const user = await addUser(okUser.email, okUser.phone, okUser.password);

        await setActiveUser(user.id);
        await setEmailValidated(user.id);
        await setPhoneValidated(user.id);
      }

      //Check and create for un-validated user
      userTemp = await getUserByEmail(okAdmin.email);
      if (!userTemp) {
        const user = await addUser(okAdmin.email, okAdmin.phone, okAdmin.password, "admin");

        await setActiveUser(user.id);
        await setEmailValidated(user.id);
        await setPhoneValidated(user.id);
      }

      //Check and create for un-validated user
      userTemp = await getUserByEmail(unvalidatedUser.email);
      if (!userTemp) {
        const user = await addUser(unvalidatedUser.email, unvalidatedUser.phone, unvalidatedUser.password);
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

      //Check and create for no Email
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

      userTemp = await getUserByEmail(unvalidatedUser.email);
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

  it('Login - User not found', async () => {
    const payload = {
      "username": "a@b.com",
      "password": "123"
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
      "password": "123"
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
      "password": "123"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 422);
    assert.equal(res.body.error, "username field is required");
  });

  it('Login - Missing Password', async () => {
    const payload = {
      "username": okUser.email,
      //"password": "ggg"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 422);
    assert.equal(res.body.error, "password field is required");
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
      "username": unvalidatedUser.email,
      "password": unvalidatedUser.password,
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "Forbidden");
  });

  it('Login - Unvalidated email user', async () => {
    const payload = {
      "username": noEmailUser.email,
      "password": noEmailUser.password,
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "Forbidden");
  });

  it('Login - Unvalidated phone user', async () => {
    const payload = {
      "username": noPhoneUser.email,
      "password": noPhoneUser.password,
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "Forbidden");
  });
});
