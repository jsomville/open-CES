import assert from "node:assert";
import request from 'supertest';

import { app } from "../app.js";
import config from "./config.test.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'

import { deleteMerchantByName } from "../services/merchant_service.js";

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

describe("Merchant Test", () => {
  let admin_access_token;
  let user_access_token;

  let new_merchant_id;

  const minimum_merchant_payload = {
    "name": "Test_Merchant1",
    "region": "EU",
  }
  const merchant_payload = {
    "name": "Test_Merchant2",
    "region": "EU",
    "email": "merchant@opences.org",
    "phone": "+3212345678",
    "website": "https://merchant.opences.org",
    "address": "123 Merchant St, EU",
    "latitude": 50.8503,
    "longitude": 4.3517
  }

  before(async () => {
    //Get main Testing Tokens
    user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
    admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

  });

  after(async () => {
    await deleteMerchantByName(minimum_merchant_payload.name);
    await deleteMerchantByName(merchant_payload.name);
  });

  it('List All Merchant - Admin', async () => {
    const res = await request(app)
      .get('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 200);
  });

  it('List All Merchant - User', async () => {
    const res = await request(app)
      .get('/api/merchant')
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  /****************************** */
  // Add Merchant Tests
  /****************************** */

  it('Add Minimum Merchant - User', async () => {
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${user_access_token}`)
      .send(minimum_merchant_payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Add Minimum Merchant - Admin', async () => {
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(minimum_merchant_payload)

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.name, minimum_merchant_payload.name);
    assert.equal(res.body.region, minimum_merchant_payload.region);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);
  });

  it('Add Merchant - User', async () => {
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${user_access_token}`)
      .send(merchant_payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Add Merchant - Admin', async () => {
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(merchant_payload)

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.name, merchant_payload.name);
    assert.equal(res.body.email, merchant_payload.email);
    assert.equal(res.body.phone, merchant_payload.phone);
    assert.equal(res.body.region, merchant_payload.region);
    assert.equal(res.body.address, merchant_payload.address);
    assert.equal(res.body.latitude, merchant_payload.latitude);
    assert.equal(res.body.longitude, merchant_payload.longitude);
    assert.equal(res.body.website, merchant_payload.website);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);

    new_merchant_id = res.body.id;
  });

  it('Add Merchant - No Name', async () => {
    const payload = {
      //name: "abc",
      region: "EU",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - Name too short', async () => {
    const payload = {
      name: "abc",
      region: "EU",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - Name too long', async () => {
    const payload = {
      name: 'x'.repeat(256),
      region: "EU",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - No Region', async () => {
    const payload = {
      name: "abcdef",
      //region: "EU",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - Region too long', async () => {
    const payload = {
      name: "Valid Name",
      region: 'y'.repeat(300),
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - Invalid email', async () => {
    const payload = {
      name: "Valid Name",
      email: "not-an-email",
      phone: "+3212345678",
      region: "EU",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - Phone too short', async () => {
    const payload = {
      name: "Valid Name",
      email: "ok@opences.org",
      phone: "1",
      region: "EU",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - Phone too long', async () => {
    const payload = {
      name: "Valid Name",
      email: "ok2@opences.org",
      phone: "1234567890123456",
      region: "EU",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - No payload', async () => {
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - No Name', async () => {
    const payload = {
      //"name" : "Test_Merchant",
      "email": "merchant@opences.org",
      "phone": "+3212345678",
      "region": "EU",
    }
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add Merchant - Other field', async () => {
    const payload = {
      "name": "Test_Merchant",
      "region": "EU",
      "other": "EU",
    }
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });


  it('Add Merchant - latitude string', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "not-a-number",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - latitude too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "1.12345678901234567890",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - latitude too big', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "90.001",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - latitude too small', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "-90.001",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });


  it('Add Merchant - longitude string', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "not-a-number",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - longitude too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "1.12345678901234567890",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - longitude too big', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "180.001",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - longitude too small', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "-180.001",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - invalid website', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      website: "a",
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - website too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      website: "http://abcd.com".repeat(256),
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add Merchant - Address too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      address: "h".repeat(513),
    };
    const res = await request(app)
      .post('/api/merchant')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  /****************************** */
  // Get Merchant Tests
  /****************************** */

  it('Get Merchant - Admin', async () => {
    const res = await request(app)
      .get(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, merchant_payload.name);
    assert.equal(res.body.email, merchant_payload.email);
    assert.equal(res.body.phone, merchant_payload.phone);
    assert.equal(res.body.region, merchant_payload.region);
    assert.equal(res.body.address, merchant_payload.address);
    assert.equal(res.body.latitude, merchant_payload.latitude);
    assert.equal(res.body.longitude, merchant_payload.longitude);
    assert.equal(res.body.website, merchant_payload.website);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);
  });

  it('Get Merchant - Id as string', async () => {
    const res = await request(app)
      .get(`/api/merchant/abc`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Get Merchant - Id as float', async () => {
    const res = await request(app)
      .get(`/api/merchant/4.5`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Get Merchant - Invalid Id', async () => {
    const res = await request(app)
      .get(`/api/merchant/125458`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Merchant not found");
  });

  it('Get Merchant - User', async () => {
    const res = await request(app)
      .get(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${user_access_token}`)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  /****************************** */
  // Modify Merchant Tests
  /****************************** */

  it('Modify Merchant - Admin', async () => {
    const payload = {
      name: "new name",
      email: "email@opences.org",
      phone: "+328529637",
      region: "BXL",
      address: "New Address 45, BXL",
      latitude: 50.1234,
      longitude: 4.5678,
      website: "http://new-website.com"
    }
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.name, payload.name);
    assert.equal(res.body.email, payload.email);
    assert.equal(res.body.phone, payload.phone);
    assert.equal(res.body.region, payload.region);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);
    assert.equal(res.body.address, payload.address);
    assert.equal(res.body.latitude, payload.latitude);
    assert.equal(res.body.longitude, payload.longitude);
    assert.equal(res.body.website, payload.website);
  });

  it('Modify Merchant - Not found', async () => {
    const res = await request(app)
      .put(`/api/merchant/9999999`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send({ name: 'Name Ok', email: 'ok@opences.org', phone: '+32123', region: 'EU' });

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Merchant not found');
  });

  it('Modify Merchant - Invalid id param', async () => {
    const res = await request(app)
      .put(`/api/merchant/abc`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send({ name: 'Name Ok', email: 'ok@opences.org', phone: '+32123', region: 'EU' });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - No Name', async () => {
    const payload = {
      //"name" : "new name",
      "region": "BXL",
    }
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Modify Merchant - No Region', async () => {
    const payload = {
      "name": "new name",
      //"region" : "BXL",
    }
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Modify Merchant - Other field', async () => {
    const payload = {
      "name": "Test_Merchant",
      "region": "EU",
      "other": "EU",
    }
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

   it('Modify Merchant - latitude string', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "not-a-number",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - latitude too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "1.12345678901234567890",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - latitude too big', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "90.001",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - latitude too small', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      latitude: "-90.001",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });


  it('Modify Merchant - longitude string', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "not-a-number",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - longitude too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "1.12345678901234567890",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - longitude too big', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "180.001",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - longitude too small', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      longitude: "-180.001",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - invalid website', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      website: "a",
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - website too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      website: "http://abcd.com".repeat(256),
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Modify Merchant - Address too long', async () => {
    const payload = {
      name: "Valid Name",
      region: "EU",
      address: "h".repeat(513),
    };
    const res = await request(app)
      .put(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  /****************************** */
  // Delete Merchant Tests
  /****************************** */

  it('Delete Merchant - User', async () => {
    const res = await request(app)
      .delete(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Delete Merchant - Admin', async () => {
    const res = await request(app)
      .delete(`/api/merchant/${new_merchant_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 204);
  });

  it('Delete Merchant - Invalid id (string)', async () => {
    const res = await request(app)
      .delete(`/api/merchant/abc`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(res.body.errors);
  });

  it('Delete Merchant - Invalid id (float)', async () => {
    const res = await request(app)
      .delete(`/api/merchant/4.5`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(res.body.errors);
  });

  it('Delete Merchant - Not found', async () => {
    const res = await request(app)
      .delete(`/api/merchant/9999999`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Merchant not found');
  });

  it('Delete Merchant - assigned to account', async () => {
    // create merchant, currency, user, and account referencing merchant
    const merch = await prisma.merchant.create({ data: { name: 'AcctAttach', email: 'acct@merch.org', phone: '+32000000000', region: 'EU' } });
    const cur = await prisma.currency.create({ data: { symbol: 'MRG', name: 'MerchGuard', country: 'EU' } });
    const usr = await prisma.user.create({
      data: { firstname: 'A', lastname: 'B', email: 'merchant_attach_user@open-ces.org', phone: '+32479999999', region: 'EU', passwordHash: 'FAKE', role: 'user' }
    });
    await prisma.account.create({ data: { userId: usr.id, merchantId: merch.id, currencyId: cur.id, accountType: 1 } });

    const res = await request(app)
      .delete(`/api/merchant/${merch.id}`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Merchant is still assigned to an account');

    // cleanup
    await prisma.account.deleteMany({ where: { merchantId: merch.id } });
    await prisma.user.delete({ where: { id: usr.id } });
    await prisma.currency.delete({ where: { id: cur.id } });
    await prisma.merchant.delete({ where: { id: merch.id } });
  });
});