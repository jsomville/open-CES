import { describe, it } from "node:test";
import assert from "node:assert";
import request from 'supertest';
import app from "../app.js"


describe("Test Main server", () => {
  it('call root page', async () => {
    const res = await request(app).get('/');
    assert.equal(res.statusCode, 200);
  });

  it('User Login', async () => {
    const res = await request(app).get('/api/idp/login');

    assert.equal(res.statusCode, 200);
  });


});
