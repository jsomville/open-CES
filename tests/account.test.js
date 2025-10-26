import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from '../services/currency_service.js'
import { deleteUserAndAccount } from '../services/user_service.js';
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'
import { createCurrency } from "../controller/currencyController.js";

const userEmail = "test@openced.org";

describe("Test Account", () => {
  let new_account_id;
  let account_payload;
  let admin_access_token;
  let user_access_token;
  let user_id;
  let testCurrencyId;  before(async () => {
    //Get main Testing Tokens
    user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
    admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

    const testCurrency = await getCurrencyBySymbol(config.testCurrency);
    testCurrencyId = testCurrency.id;

    //Create User to relate to account creation
   
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



  after(async () => {
    await deleteUserAndAccount(userEmail);
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

  it('Add account - Currency not found', async () => {
    const payload = {
      "userId": user_id,
      "currencyId": 9999999,
      "accountType": 1,
    };

    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Currency not found");
  });

  it('Add account - User does not exist (FK)', async () => {
    const payload = {
      "userId": 9999999,
      "currencyId": testCurrencyId,
      "accountType": 1,
    };

    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "User not found");
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

  it('Add account - Account quota reached', async () => {
    // Create dedicated currency with low accountMax
    const cur = await prisma.currency.create({
      data: { symbol: 'AQT', name: 'AcctQuotaTest', country: 'EU', accountMax: 1 }
    });

    // Create second temp user
    const userB = await prisma.user.create({
      data: {
        firstname: "Jane",
        lastname: "Smith",
        email: "quota_user_b@openced.org",
        phone: "+32471041011",
        region: "EU",
        passwordHash: "FAKE",
        role: "user"
      }
    });

    // First account should succeed
    const res1 = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send({ userId: user_id, currencyId: cur.id, accountType: 1 });
    assert.equal(res1.statusCode, 201);

    // Second account for same currency should hit quota
    const res2 = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send({ userId: userB.id, currencyId: cur.id, accountType: 1 });
    assert.equal(res2.statusCode, 403);
    assert.equal(res2.body.message, "Account quota reached");

    // cleanup
    await prisma.account.deleteMany({ where: { currencyId: cur.id } });
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.currency.delete({ where: { id: cur.id } });
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

  it('Get account - Not found', async () => {
    const res = await request(app)
      .get(`/api/account/9999999`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Account not found");
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

  it('Delete Account - Not found', async () => {
    const res = await request(app)
      .delete(`/api/account/9999999`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Account not found");
  });

  it('Delete Account - Balance must be zero', async () => {
    // Create a dedicated currency so we can create another account for the same user
    const cur = await prisma.currency.create({
      data: { symbol: 'DEL', name: 'DeleteLock', country: 'EU' }
    });

    // Create a new account for current user
    const acc = await prisma.account.create({
      data: { userId: user_id, currencyId: cur.id, accountType: 1 }
    });

    // Set non-zero balance
    await prisma.account.update({ where: { id: acc.id }, data: { balance: 10 } });

    const res = await request(app)
      .delete(`/api/account/${acc.id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Balance must be zero");

    // cleanup: reset balance to allow delete
    await prisma.account.update({ where: { id: acc.id }, data: { balance: 0 } });
    await prisma.account.delete({ where: { id: acc.id } });
    await prisma.currency.delete({ where: { id: cur.id } });
  })

});

