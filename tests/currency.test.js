import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import app from "../app.js";
import { getUserToken, getAdminToken } from './0-setup.test.js';

describe("Test Currency", () => {
    let admin_access_token;
    let user_access_token;
    let new_currency_id;
    const currency_payload = {
        "name": "TestCurrency",
        "symbol": "TST",
        "country": "BE"
    };
    const new_symbol = "TTT";

    before(async () => {
        try {
            //Get main Testing Tokens
            user_access_token = getUserToken();
            admin_access_token = getAdminToken();

            //Delete currency if exist
            const cur = await prisma.currency.findUnique({ where: { symbol: currency_payload.symbol } })
            if (cur) {
                await prisma.currency.delete({
                    where: {
                        symbol: currency_payload.symbol
                    }
                });
            }

            const cur2 = await prisma.currency.findUnique({ where: { symbol: new_symbol } })
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

    it('Add currency - User', async () => {
        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(currency_payload);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
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
        assert.equal(res.body.balance, 0);
        assert.equal(res.body.accountMax, 100);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)

        new_currency_id = res.body.id
    });

    it('Add currency - No Payload', async () => {
        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 422);
    });

    it('Add currency - No Name', async () => {
        const payload = {
            "symbol": "TC",
            "country": "EU",
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Name field is requied or too short");
    });

    it('Add currency - No Symbol', async () => {
        const payload = {
            "name": "Test Currency",
            "country": "EU",
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Symbol field is requied or too long");
    });

    it('Add currency - No Country', async () => {
        const payload = {
            "symbol": "TC",
            "name": "Test Currency",
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Country field is requied 2 or 3 characters");
    });

    it('Add currency - Duplicated Name', async () => {
        const payload = {
            "name": currency_payload.name,
            "symbol": "TC2",
            "country": "BE"
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.error, "Name must be unique");
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
        assert.equal(res.body.error, "Symbol must be unique");
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

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Name field is requied or too short");

    });

    it('Add currency - Symbol too long', async () => {
        const payload = {
            "name": "UniqueCurrency",
            "symbol": "12345ywr",
            "country": "BE"
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Symbol field is requied or too long");
    });

    // Get Currency
    it('Get Currency', async () => {
        const res = await request(app)
            .get(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.name, currency_payload.name);
        assert.equal(res.body.symbol, currency_payload.symbol);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    it('Get Currency - Invalid ID', async () => {
        const res = await request(app)
            .get(`/api/currency/9999`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });

    it('Modify Currency', async () => {
        const payload = {
            "name": "Test Currency2",
            "symbol": new_symbol,
            "country": "BE",
            "accountMax": 150,
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.name, payload.name);
        assert.equal(res.body.symbol, payload.symbol);
        assert.equal(res.body.country, payload.country);
        assert.equal(res.body.accountMax, payload.accountMax);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    it('Modify Currency - User', async () => {
        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Modify Currency - No Payload', async () => {
        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 422);
    });

    it('Modify Currency - No Name', async () => {
        const payload = {
            "symbol": "TC2",
            "country": "BE",
            "accountMax": 88
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Name field mandatory or too short");
    });

    it('Modify Currency - No Symbol', async () => {
        const payload = {
            "name": "Test Currency2",
            //"symbol" : "TC2",
            "country": "BE",
            "accountMax": 88
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Symbol field mandatory or too long");
    });

    it('Modify Currency - No Acount Max', async () => {
        const payload = {
            "name": "Test Currency2",
            "symbol": "TC2",
            "country": "BE",
            //"accountMax": 88
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "AccountMax field mandatory");
    });

    it('Delete Currency - user', async () => {
        const res = await request(app)
            .delete(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Delete Currency - Invalid ID', async () => {
        const res = await request(app)
            .delete(`/api/currency/99999`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });

    it('Delete Currency - Admin', async () => {
        const res = await request(app)
            .delete(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);
    });
});

