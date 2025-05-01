import { describe, it, test } from "node:test";
import assert from "node:assert";
import request from 'supertest';

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
  });
});
