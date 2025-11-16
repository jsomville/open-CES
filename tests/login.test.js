import assert from "node:assert";
import request from 'supertest';
import jwt from 'jsonwebtoken';

import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { app } from "../app.js";
import { setActiveUserById, getUserByEmail, createUser } from "../services/user_service.js";
import redisHelper from '../utils/redisHelper.js';

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
   const lockedUser = {
    email: "locked_user@open-ces.org",
    password: "Abcd1234efgh!",
    phone: "3113465987",
  }
  const notValidatedUser = {
    email: "unvalidated@open-ces.org",
    password: "Abcd1234efgh!",
    phone: "312523465987",
  };

  let validAccessToken = ""
  let validRefreshToken = ""

  before(async () => {
    try {
      let userTemp;

      //Check and create for validated user
      userTemp = await getUserByEmail(okUser.email);
      if (!userTemp) {
        const hashedPassword = await argon2.hash(okUser.password);
        const user = await createUser(okUser.email, okUser.phone, hashedPassword, "user", "firstname", "lastname");

        await setActiveUserById(user.id);
      }

      //Check and create for validated admin
      userTemp = await getUserByEmail(okAdmin.email);
      if (!userTemp) {
        const hashedPassword = await argon2.hash(okAdmin.password);
        const user = await createUser(okAdmin.email, okAdmin.phone, hashedPassword, "admin", "firstname", "lastname");

        await setActiveUserById(user.id);
      }

      //Check and create for not validated user
      userTemp = await getUserByEmail(notValidatedUser.email);
      if (!userTemp) {
        const hashedPassword = await argon2.hash(notValidatedUser.password);
        await createUser(notValidatedUser.email, notValidatedUser.phone, hashedPassword, "user", "firstname", "lastname");
      }

      //Check and create for validated admin
      userTemp = await getUserByEmail(lockedUser.email);
      if (!userTemp) {
        const hashedPassword = await argon2.hash(lockedUser.password);
        const user = await createUser(lockedUser.email, lockedUser.phone, hashedPassword, "user", "firstname", "lastname");

        await setActiveUserById(user.id);
      }
    }
    catch (error) {
      console.error(error);
      throw error;
    }

  });

  after(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [okUser.email, okAdmin.email, notValidatedUser.email, lockedUser.email]
          }
        }
      });

      await redisHelper.del(`LoginAttempts:${lockedUser.email}`);
      await redisHelper.del(`Lockout:${lockedUser.email}`);
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

    //Check Last Login updated
    const user = await getUserByEmail(okUser.email);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - user.lastLoginAt.getTime());
    assert.ok(timeDiff < 1000); //10 seconds
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
    assert.equal(res.body.error, "User is not active");
  });

  it('account locked after too many failed login attempts', async () => {
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

    const username = lockedUser.email;

    for (let i = 0; i < maxAttempts; i++) {
      const res = await request(app)
        .post('/api/idp/login')
        .send({ username, password: 'WrongPassword123!' });

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.error, "Invalid username or password");
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send({ username, password: 'WrongPassword123!' });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "Account locked due to too many failed login attempts. Please try again later.");

    //Delete redis count and lockout for next tests
    await redisHelper.del(`LoginAttempts:${username}`);
    await redisHelper.del(`Lockout:${username}`);

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
