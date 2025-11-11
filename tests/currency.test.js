import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from "../services/currency_service.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'
import { createCurrencyMainAccount } from "../services/account_service.js";


describe("Test Currency", () => {
    let admin_access_token;
    let user_access_token;
    let new_currency_id;

    const currency_payload = {
        symbol: "TST",
        name: "TSTCurrency",
        country: "BE",
        accountMax: 150,
        regionList: '[1000, 1030]',
        logoURL: "https://www.example.com",

        webSiteURL: "https://www.example.com/",
        newAccountWizardURL: "https://www.example.com/",
        topOffWizardURL: "https://www.example.com/",
        androidAppURL: "https://www.example.com/",
        iphoneAppURL: "https://www.example.com/",
        androidAppLatestVersion: "1.2.3",
        iphoneAppLatestVersion: "1.2.3",
    };

    const testingCurrencySymbol = "TST2";
    const testingCurrencyDelete = "TDEL"

    before(async () => {
        try {
            //Get main Testing Tokens
            user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
            admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

            //Delete Accounts
            let currency;
            currency = await getCurrencyBySymbol(currency_payload.symbol);
            if (currency) {
                await prisma.account.deleteMany({
                    where: {
                        currencyId: currency.id
                    }
                });
            }

            currency = await getCurrencyBySymbol(testingCurrencySymbol);
            if (currency) {
                await prisma.account.deleteMany({
                    where: {
                        currencyId: currency.id
                    }
                });
            }

            currency = await getCurrencyBySymbol(testingCurrencyDelete);
            if (currency) {
                await prisma.account.deleteMany({
                    where: {
                        currencyId: currency.id
                    }
                });
            }

            await prisma.currency.deleteMany({
                where: {
                    OR: [
                        { symbol: currency_payload.symbol },
                        { symbol: testingCurrencySymbol },
                        { symbol: testingCurrencyDelete },
                    ]
                }
            });
        }
        catch (error) {
            console.log("Currency test Error", error.message);
        }
    });

    after(async () => {
        try {
            //Delete Accounts
            let currency;
            currency = await getCurrencyBySymbol(currency_payload.symbol);
            if (currency) {
                await prisma.account.deleteMany({
                    where: {
                        currencyId: currency.id
                    }
                });
            }

            currency = await getCurrencyBySymbol(testingCurrencySymbol);
            if (currency) {
                await prisma.account.deleteMany({
                    where: {
                        currencyId: currency.id
                    }
                });
            }

            currency = await getCurrencyBySymbol(testingCurrencyDelete);
            if (currency) {
                await prisma.account.deleteMany({
                    where: {
                        currencyId: currency.id
                    }
                });
            }


            await prisma.currency.deleteMany({
                where: {
                    OR: [
                        { symbol: currency_payload.symbol },
                        { symbol: testingCurrencySymbol },
                        { symbol: testingCurrencyDelete },
                    ]
                }
            });
        }
        catch (error) {
            console.log("Currency test Error", error.message);
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
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);
        assert.equal(res.body.newAccountWizardURL, currency_payload.newAccountWizardURL);
        assert.equal(res.body.topOffWizardURL, currency_payload.topOffWizardURL);
        assert.equal(res.body.androidAppURL, currency_payload.androidAppURL);
        assert.equal(res.body.iphoneAppURL, currency_payload.iphoneAppURL);
        assert.equal(res.body.androidAppLatestVersion, currency_payload.androidAppLatestVersion);
        assert.equal(res.body.iphoneAppLatestVersion, currency_payload.iphoneAppLatestVersion);

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
            symbol: testingCurrencySymbol,
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
            symbol: testingCurrencySymbol,
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

        prisma.currency.deleteMany({
            where: {
                symbol: testingCurrencySymbol
            }
        });

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
            //name: "Test Currency",
            symbol: testingCurrencySymbol,
            country: "EU",
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
            name: "Test Currency",
            //symbol: testingCurrencySymbol,
            country: "EU",
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
            name: "Test Currency",
            symbol: testingCurrencySymbol,
            //country: "EU",
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
            name: "123",
            symbol: testingCurrencySymbol,
            country: "BE"
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
            name: "123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789",
            symbol: testingCurrencySymbol,
            country: "BE"
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
            name: "UniqueCurrencyLong",
            symbol: "12345ywr",
            country: "BE"
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
            name: "New_Name",
            symbol: testingCurrencySymbol,
            country: "BE",
            logoURL: "http://testme.com/3456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789v123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789/image.png",
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
            name: "New Name",
            symbol: testingCurrencySymbol,
            country: "BE",
            webSiteURL: "http://testme.com/3456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789v123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789/image.png",
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
            name: "New Name",
            symbol: testingCurrencySymbol,
            country: "BE",
            regionList: "3456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789v123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789",
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
            name: "New Name",
            symbol: testingCurrencySymbol,
            country: "BE",
            other: "field",
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
            name: currency_payload.name,
            symbol: "TC2",
            country: "BE",
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
            name: "Test Currency2",
            symbol: currency_payload.symbol,
            country: "BE"
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
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);
        assert.equal(res.body.newAccountWizardURL, currency_payload.newAccountWizardURL);
        assert.equal(res.body.topOffWizardURL, currency_payload.topOffWizardURL);
        assert.equal(res.body.androidAppURL, currency_payload.androidAppURL);
        assert.equal(res.body.iphoneAppURL, currency_payload.iphoneAppURL);
        assert.equal(res.body.androidAppLatestVersion, currency_payload.androidAppLatestVersion);
        assert.equal(res.body.iphoneAppLatestVersion, currency_payload.iphoneAppLatestVersion);
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

    /***************************** */
    // DELETE Currency Tests
    /***************************** */

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
        const currency = await prisma.currency.create({
            data: {
                symbol: testingCurrencyDelete,
                name: 'ToDelete',
                country: 'BE',
            }
        });

        const res = await request(app)
            .delete(`/api/currency/${currency.id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);

        await prisma.currency.deleteMany({
            where: {
                symbol: testingCurrencyDelete
            }
        });
    });

    it('Delete Currency - Referenced by accounts', async () => {
        const currency = await prisma.currency.create({
            data: {
                symbol: testingCurrencyDelete,
                name: 'ToDelete',
                country: 'BE',
            }
        });

        const mainAccount = await createCurrencyMainAccount(currency);
        const res = await request(app)
            .delete(`/api/currency/${currency.id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 409);
        assert.ok(res.body.message.includes('Currency id is being used in'));

        await prisma.account.delete({ where: { number: mainAccount.number } });

        await prisma.currency.deleteMany({
            where: {
                symbol: testingCurrencyDelete
            }
        });
    });

    it('Delete Currency - Balance not zero', async () => {
        const currency = await prisma.currency.create({
            data: {
                symbol: testingCurrencyDelete,
                name: 'ToDelete',
                country: 'BE',
            }
        });

        const mainAccount = await createCurrencyMainAccount(currency);
        await prisma.account.update({
            where: { number: mainAccount.number },
            data: { balance: 100 },
        });

        const res = await request(app)
            .delete(`/api/currency/${currency.id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.message, 'Balance must be zero');

        // cleanup
        await prisma.account.delete({ where: { number: mainAccount.number } });
        await prisma.currency.deleteMany({
            where: {
                symbol: testingCurrencyDelete
            }
        });
    });


});

