//import { describe, it } from "node:test";
import assert from "node:assert";
import request from 'supertest';

import app from "../app.js";
import config from "./config.test.js";
import { getAccessToken } from "../controller/idpController.js"

describe("Test Currency", () => {
    let admin_access_token;
    let user_access_token;

    before(async () => {
        // Create User Token
        const user_token_parameters = {
            "email" : config.userEmail,
            "role" : "user"
        }
        user_access_token = getAccessToken(user_token_parameters)
        
        // Create Admin Token
        const admin_token_parameters = {
            "email" : config.adminEmail,
            "role" : "admin"
        }
        admin_access_token = getAccessToken(admin_token_parameters);
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

    let new_currency_id = 0
    const currency_payload = {
        "name" : "Test Currency",
        "symbol" : "TC"
    };

    const test_token = "abc";

    it('Add currency - Admin', async () => {
        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(currency_payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.name, currency_payload.name);
        assert.equal(res.body.symbol, currency_payload.symbol);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)

        new_currency_id = res.body.id
    });

    it('Add currency - User', async () => {
        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(currency_payload);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Add currency - No Payload', async () => {
        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 422);
    });

    it('Add currency - No Name', async () => {
        const payload = {
            "symbol" : "TC"
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
            "name" : "Test Currency"
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Symbol field is requied or too long");
    });

    it('Add currency - Duplicated Name', async () => {
        const payload = {
            "name" : currency_payload.name,
            "symbol" : "TC2"
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 500);
    });

    it('Add currency - Duplicated Symbol', async () => {
        const payload = {
            "name" : "Test Currency2",
            "symbol" : currency_payload.symbol
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 500);
    });

    it('Add currency - Name Too short', async () => {
        const payload = {
            "name" : "123",
            "symbol" : "TC"
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });

    it('Add currency - Symbol too long', async () => {
        const payload = {
            "name" : "UniqueCurrency",
            "symbol" : "1234567"
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });

    // Get Currency
    it ('Get Currency', async () => {
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

    it ('Get Currency - Invalid ID', async () => {
        const res = await request(app)
            .get(`/api/currency/9999`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });

    it ('Modify Currency', async () => {
        const payload = {
            "name" : "Test Currency2",
            "symbol" : "TC2"
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.name, payload.name);
        assert.equal(res.body.symbol, payload.symbol);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    it ('Modify Currency -User Token', async () => {
        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it ('Modify Currency - No Payload', async () => {
        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 422);
    });

    it ('Modify Currency - No Name', async () => {
        const payload = {

            "symbol" : "TC2"
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Name field mandatory");
    });

    it ('Modify Currency - No Symbol', async () => {
        const payload = {
            "name" : "Test Currency2",
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Symbol field mandatory");
    });


    it ('Delete Currency', async () => {
        const res = await request(app)
            .delete(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);
    });

    it ('Delete Currency', async () => {
        const res = await request(app)
            .delete(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it ('Delete Currency - Invalid ID', async () => {
        const res = await request(app)
            .delete(`/api/currency/99999`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });
  });