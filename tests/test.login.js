import { describe, it, test } from "node:test";
import assert from "node:assert";
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from "../app.js";

import config from "./config.js";

describe("Login Test", () => {

  // Check a normal user can login
  it('User Login', async () => {
    const payload = {
      "username" : config.userEmail,
      "password" : config.userPassword
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);

   
    // Access Token 
    const decoded_access_token = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET_KEY );
    assert.equal(decoded_access_token.sub, config.userEmail);
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

  it('Admin User Login', async () => {
    const payload = {
      "username" : config.adminEmail,
      "password" : config.adminPassword
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);

    // Access Token
    const decoded_access_token = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET_KEY);
    assert.equal(decoded_access_token.sub, config.adminEmail);
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

  it('User Login - Invalid User Credentials', async () => {
    const payload = {
      "username" : config.userEmail,
      "password" : "123"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 401);
  });

  it('User Login - Invalid Admin Credentials', async () => {
    const payload = {
      "username" : config.adminEmail,
      "password" : "123"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 401);
  });

  it('User Login - Invalid Credentials', async () => {
    const payload = {
      "username" : "a@b.com",
      "password" : "123"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

    assert.equal(res.statusCode, 401);
  });

  it('User Login - Missing Username', async () => {
    const payload = {
      "password" : "123"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

      assert.equal(res.statusCode, 422);
  });

  it('User Login - Missing Password', async () => {
    const payload = {
      "username" : "a@b.com"
    }

    const res = await request(app)
      .post('/api/idp/login')
      .send(payload)

      assert.equal(res.statusCode, 422);
  });
});
