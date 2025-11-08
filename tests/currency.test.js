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
    symbol: "TST",
    name: "TestCurrency",
    country: "BE",
    accountMax: 150,
    regionList: '[1000, 1030]',
    logoURL: "https://www.example.com",

    webSiteURL: "https://www.example.com",
    newAccountWizardURL: "https://www.example.com/",
    topOffWizardURL: "https://www.example.com/",
    androidAppURL: "https://www.example.com/",
    iphoneAppURL: "https://www.example.com/",
    androidAppLatestVersion: "1.2.3",
    iphoneAppLatestVersion: "1.2.3",
    accountFormatNumber: "N/A",

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
    // ensure balance field is filtered out
    if (Array.isArray(res.body) && res.body.length) {
      assert.ok(!('balance' in res.body[0]));
    }
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
    if (Array.isArray(res.body) && res.body.length) {
      const item = res.body[0];
      assert.ok(!('balance' in item));
      assert.ok(!('accountMax' in item));
      assert.ok(!('createdAt' in item));
      assert.ok(!('updatedAt' in item));
      assert.ok(!('activeAccount' in item));
      assert.ok(!('accountNextNumber' in item));
    }
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
    assert.equal(res.body.newAccountWizardURL, currency_payload.newAccountWizardURL);
    assert.equal(res.body.topOffWizardURL, currency_payload.topOffWizardURL);
    assert.equal(res.body.androidAppURL, currency_payload.androidAppURL);
    assert.equal(res.body.iphoneAppURL, currency_payload.iphoneAppURL);
    assert.equal(res.body.androidAppLatestVersion, currency_payload.androidAppLatestVersion);
    assert.equal(res.body.iphoneAppLatestVersion, currency_payload.iphoneAppLatestVersion);
    assert.equal(res.body.accountFormatNumber, currency_payload.accountFormatNumber);

    new_currency_id = res.body.id
  });

  it('Add currency - accountMax below minimum', async () => {
    const payload = {
      name: 'BelowMin',
      symbol: 'BLW',
      country: 'BE',
      accountMax: 50,
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(res.body.errors);
  });

  it('Add currency - invalid URL formats', async () => {
    const payload = {
      name: 'BadURL',
      symbol: 'BURL',
      country: 'BE',
      logoURL: 'not-a-url',
      webSiteURL: 'also-not-a-url',
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(res.body.errors);
  });

  it('Add currency - empty URLs accepted', async () => {
    const payload = {
      name: 'EmptyURLs',
      symbol: new_symbol,
      country: 'BE',
      logoURL: '',
      webSiteURL: '',
    };

    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.name, payload.name);
    assert.equal(res.body.symbol, payload.symbol);

    // cleanup created currency
    await prisma.currency.delete({ where: { id: res.body.id } });
  });

  it('Add currency - No Payload', async () => {
    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Validation failed");
  });

  it('Add currency - Mandatory field No Name', async () => {
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

  it('Add currency - Mandatory field No Symbol', async () => {
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

  it('Add currency - Mandatory field No Country', async () => {
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
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);
    assert.equal(res.body.newAccountWizardURL, currency_payload.newAccountWizardURL);
    assert.equal(res.body.topOffWizardURL, currency_payload.topOffWizardURL);
    assert.equal(res.body.androidAppURL, currency_payload.androidAppURL);
    assert.equal(res.body.iphoneAppURL, currency_payload.iphoneAppURL);
    assert.equal(res.body.androidAppLatestVersion, currency_payload.androidAppLatestVersion);
    assert.equal(res.body.iphoneAppLatestVersion, currency_payload.iphoneAppLatestVersion);
    assert.equal(res.body.accountFormatNumber, currency_payload.accountFormatNumber);
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

  it('Modify Currency - Currency not found', async () => {
    const res = await request(app)
      .put(`/api/currency/9999999`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send({ country: 'BE' });

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Currency not found');
  });

  it('Modify Currency - invalid URL formats', async () => {
    const res = await request(app)
      .put(`/api/currency/${new_currency_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send({ country: 'BE', logoURL: 'x', webSiteURL: 'y' });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(res.body.errors);
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

  it('Delete Currency - Balance not zero', async () => {
    // create isolated currency and set balance
    const cur = await prisma.currency.create({ data: { symbol: 'DNZ', name: 'DelNotZero', country: 'BE', balance: 10 } });
    const res = await request(app)
      .delete(`/api/currency/${cur.id}`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 422);
    assert.equal(res.body.message, 'Balance must be zero');

    // cleanup
    await prisma.currency.delete({ where: { id: cur.id } });
  });

  it('Delete Currency - Referenced by accounts', async () => {
    // create currency and account referencing it
    const cur = await prisma.currency.create({ data: { symbol: 'REF2', name: 'RefByAccount', country: 'BE' } });
    const user = await prisma.user.create({
      data: {
        firstname: 'A', lastname: 'B', email: 'refacc@open-ces.org', phone: '+32471111111', region: 'EU', passwordHash: 'FAKE', role: 'user'
      }
    });
    await prisma.account.create({ data: { userId: user.id, currencyId: cur.id, accountType: 1 } });

    const res = await request(app)
      .delete(`/api/currency/${cur.id}`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 409);
    assert.ok(res.body.message.includes('Currency id is being used in'));

    // cleanup
    await prisma.account.deleteMany({ where: { currencyId: cur.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.currency.delete({ where: { id: cur.id } });
  });
});

