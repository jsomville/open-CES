import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from "../services/currency_service.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'


describe("Test Currency", () => {
  let admin_access_token;
  let user_access_token;
  let new_currency_id;

  const currency_payload = {
    "symbol": "TST",
    "name": "TestCurrency",
    "country": "BE",
    "accountMax": 150,
    "regionList": '[1000, 1030, 1040, 1050, 1060, 1070, 1080, 1081, 1082, 1083, 1090, 1130, 1140, 1150, 1160, 1170, 1180, 1190, 1200, 1210, 1212 ]',
    "logoURL": "https://www.zinne.brussels/wp-content/uploads/2023/08/logo-200.png",
    "webSiteURL": "https://www.zinne.brussels",
  };
  const new_symbol = "TTT";

  before(async () => {
    try {
      //Get main Testing Tokens
      user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
      admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

      //Delete currency if exist
      const cur = await getCurrencyBySymbol(currency_payload.symbol);
      if (cur) {
        await prisma.currency.delete({
          where: {
            symbol: currency_payload.symbol
          }
        });
      }

      const cur2 = await getCurrencyBySymbol(new_symbol);
      if (cur2) {
        await prisma.currency.deleteMany({
          where: {
            symbol: new_symbol
          }
        });
      }
    }
    catch (error) {
      console.log(error.message);
    }

  });

  it('List all currencies - User', async () => {
    const res = await request(app)
      .get('/api/currency')
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 200);
  });

  it('List all currencies - Admin', async () => {
    const res = await request(app)
      .get('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 200);
  });

  it('List currencies details- User', async () => {
    const res = await request(app)
      .get('/api/currency/details')
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 200);
  });

  it('List currencies details- Admin', async () => {
    const res = await request(app)
      .get('/api/currency/details')
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 200);
  });

  it('Add currency - User', async () => {
    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${user_access_token}`)
      .send(currency_payload);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Add currency - Admin', async () => {
    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(currency_payload)

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.name, currency_payload.name);
    assert.equal(res.body.symbol, currency_payload.symbol);
    assert.equal(res.body.country, currency_payload.country);
    assert.equal(res.body.accountMax, currency_payload.accountMax);
    assert.equal(res.body.logoURL, currency_payload.logoURL);
    assert.equal(res.body.regionList, currency_payload.regionList);
    assert.equal(res.body.webSiteURL, currency_payload.webSiteURL);
    assert.equal(res.body.balance, 0);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);

    new_currency_id = res.body.id
  });

  it('Add currency - No Payload', async () => {
    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
  });

  it('Add currency - No Name', async () => {
    const payload = {
      //"name": "Test Currency",
      "symbol": "TC",
      "country": "EU",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - No Symbol', async () => {
    const payload = {
      "name": "Test Currency",
      //"symbol": "TC",
      "country": "EU",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - No Country', async () => {
    const payload = {
      "name": "Test Currency",
      "symbol": "TC",
      //"country": "EU",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - Name Too short', async () => {
    const payload = {
      "name": "123",
      "symbol": "TC",
      "country": "BE"
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - Name Too Long', async () => {
    const payload = {
      "name": "123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789",
      "symbol": "TC",
      "country": "BE"
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - Symbol too long', async () => {
    const payload = {
      "name": "UniqueCurrencyLong",
      "symbol": "12345ywr",
      "country": "BE"
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - LogoURL Too Long', async () => {
    const payload = {
      "name": "New Name",
      "symbol": "TC",
      "country": "BE",
      "logoURL": "http://testme.com/3456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789v123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789/image.png",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - webSiteURL Too Long', async () => {
    const payload = {
      "name": "New Name",
      "symbol": "TC",
      "country": "BE",
      "webSiteURL": "http://testme.com/3456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789v123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789/image.png",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - regionList Too Long', async () => {
    const payload = {
      "name": "New Name",
      "symbol": "TC",
      "country": "BE",
      "regionList": "3456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789v123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });


  it('Add currency - Other field', async () => {
    const payload = {
      "name": "New Name",
      "symbol": "TC",
      "country": "BE",
      "balance": "150",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Add currency - Duplicated Name', async () => {
    const payload = {
      "name": currency_payload.name,
      "symbol": "TC2",
      "country": "BE",
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Name must be unique");
  });

  it('Add currency - Duplicated Symbol', async () => {
    const payload = {
      "name": "Test Currency2",
      "symbol": currency_payload.symbol,
      "country": "BE"
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Symbol must be unique");
  });

  // Get Currency
  it('Get Currency - Admin', async () => {
    const res = await request(app)
      .get(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, currency_payload.name);
    assert.equal(res.body.symbol, currency_payload.symbol);
    assert.equal(res.body.country, currency_payload.country);
    assert.equal(res.body.accountMax, currency_payload.accountMax);
    assert.equal(res.body.logoURL, currency_payload.logoURL);
    assert.equal(res.body.regionList, currency_payload.regionList);
    assert.equal(res.body.webSiteURL, currency_payload.webSiteURL);
    assert.equal(res.body.balance, 0);
    assert.ok(res.body.createdAt)
    assert.ok(res.body.updatedAt)
  });

  it('Get Currency - Invalid ID', async () => {
    const res = await request(app)
      .get(`/api/currency/abc`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Get Currency - Not found', async () => {
    const res = await request(app)
      .get(`/api/currency/9999`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Currency not found");
  });

  it('Modify Currency - Admin', async () => {
    const payload = {
      "country": "BE",
      "accountMax": 150,
    };

    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, new_currency_id);
    assert.equal(res.body.name, currency_payload.name);
    assert.equal(res.body.symbol, currency_payload.symbol);
    assert.equal(res.body.country, payload.country);
    assert.equal(res.body.accountMax, payload.accountMax);
    assert.equal(res.body.balance, 0);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);

  });

  it('Modify Currency - User', async () => {
    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Modify Currency - No Payload', async () => {
    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
  });

  it('Modify Currency - No Country', async () => {
    const payload = {
      //"country": "BE",
      "accountMax": 120
    };

    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Modify Currency - Country too short', async () => {
    const payload = {
      "country": "B",
      "accountMax": 120
    };

    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Modify Currency - Country too long', async () => {
    const payload = {
      "country": "Belgium",
      "accountMax": 120,
    };

    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Modify Currency - Other field', async () => {
    const payload = {
      "country": "BE",
      "accountMax": 120,
      "balance": 123,
    };

    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(res.body.errors);
    assert.strictEqual(res.body.errors.length, 1);
  });

  it('Delete Currency - user', async () => {
    const res = await request(app)
      .delete(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Delete Currency - Invalid ID', async () => {
    const res = await request(app)
      .delete(`/api/currency/99999`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Currency not found");
  });

  it('Delete Currency - Admin', async () => {
    const res = await request(app)
      .delete(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 204);
  });
});

