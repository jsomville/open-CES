//import { describe, it, test } from "node:test";
import assert from 'assert';
import request from 'supertest';

import app from "../app.js"

describe.skip("Test Main server", () => {
  // Check server is running
  it('Call root page', async () => {
    const res = await request(app).get('/');
    assert.equal(res.statusCode, 200);
  });
});
