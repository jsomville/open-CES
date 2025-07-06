import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from '../services/currency_service.js'
import { deleteUserAndAccount } from '../services/user_service.js';
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'


describe("Test Account", () => {
  let new_account_id;
  let account_payload;
  let admin_access_token;
  let user_access_token;
  let user_id;
  let testCurrencyId;

  before(async () => {
    //Wait for 1 sec --> bug before
    //await new Promise(resolve => setTimeout(resolve, 100)); // 1 second

    //console.log("Account - Before")

    //Get main Testing Tokens
    user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
    admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

    const testCurrency = await getCurrencyBySymbol(config.testCurrency);
    testCurrencyId = testCurrency.id;

    //Create User to relate to account creation
    const userEmail = "test@openced.org";
    await deleteUserAndAccount(userEmail);

    const user = await prisma.user.create({
      data: {
        firstname: "John",
        lastname: "Doe",
        email: userEmail,
        phone: "+32471041010",
        region: "EU",
        passwordHash: "FAKE",
        role: "user"
      }
    })
    if (!user) {
      throw new Error("Account Test - Before - User not found")
    }
    user_id = user.id;

    // Test payload
    account_payload = {
      "userId": user_id,
      "currencyId": testCurrencyId,
      "accountType": 1,
    };

  });

  it('List all Account - Admin', async () => {
    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 200);
  });

  it('List all Account - User', async () => {
    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Add account - Admin', async () => {
    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(account_payload)

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.id);
    assert.equal(res.body.userId, account_payload.userId);
    assert.equal(res.body.merchantId, null);
    assert.equal(res.body.currencyId, account_payload.currencyId);
    assert.equal(res.body.accountType, account_payload.accountType);
    assert.equal(res.body.balance, 0);
    assert.ok(res.body.createdAt)
    assert.ok(res.body.updatedAt)

    new_account_id = res.body.id;
  });

  it('Add account - User', async () => {
    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${user_access_token}`)
      .send(account_payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Add account - No payload', async () => {
    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
  });

  it('Add account - No UserID', async () => {
    const payload = {
      //"userId" : user.id,
      "currencyId": testCurrencyId,
      "accountType": 0
    };
    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add account - No Currency', async () => {
    const payload = {
      "userId": user_id,
      //"currencyId" : testCurrencyId,
      "accountType": 0
    };
    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add account - Other field', async () => {
    const payload = {
      "userId": user_id,
      "currencyId": testCurrencyId,
      "accountType": 0,
      "some field": "blabla"
    };

    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add account - No Account Type', async () => {
    const payload = {
      "userId": user_id,
      "currencyId": testCurrencyId,
      //"accountType" : 0
    };
    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add account - Admin account exist for this currency', async () => {
    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(account_payload)

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Account for this user and this currecny already exists")
  });

  it('Get account - Admin', async () => {
    const res = await request(app)
      .get(`/api/account/${new_account_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.id);
    assert.equal(res.body.userId, user_id);
    assert.equal(res.body.merchantId, null);
    assert.equal(res.body.balance, 0);
    assert.ok(res.body.createdAt)
    assert.ok(res.body.updatedAt)
  });

  it('Get account - User', async () => {
    const res = await request(app)
      .get(`/api/account/${new_account_id}`)
      .set('Authorization', `Bearer ${user_access_token}`)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Get account - Account is string', async () => {
    const res = await request(app)
      .get(`/api/account/abc`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Get account - Account is float', async () => {
    const res = await request(app)
      .get(`/api/account/4.5`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Delete Account - user', async () => {
    const res = await request(app)
      .delete(`/api/account/${new_account_id}`)
      .set('Authorization', `Bearer ${user_access_token}`)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Delete Account - account is string', async () => {
    const res = await request(app)
      .delete(`/api/account/abc`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Delete Account - account is float', async () => {
    const res = await request(app)
      .delete(`/api/account/4.5`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Delete Account - admin', async () => {
    const res = await request(app)
      .delete(`/api/account/${new_account_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 204);
  });
});

