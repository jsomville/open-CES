import assert from 'assert';
import request from 'supertest';

import { app } from "../app.js"

describe("Test Main server", () => {

  // Check server is running
  it('Call root page', async () => {
    const res = await request(app)
      .get('/');

    assert.equal(res.statusCode, 200);
  });
});
