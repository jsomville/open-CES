import { describe, it } from "node:test";
import assert from "node:assert";
import request from 'supertest';
import app from "../app.js"
import {admin_access_token, user_access_token} from './test.setup.js'

describe("Test Currency", () => {

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

    // Post - Add currency
    it('Add currency', async () => {
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
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
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
    });
    it('Add currency - Empty Name', async () => {
        const payload = {
            "name" : "",
            "symbol" : "TC"
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });

    it('Add currency - Empty Symbol', async () => {
        const payload = {
            "name" : "Test Currency",
            "symbol" : ""
        };

        const res = await request(app)
            .post('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
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
    });


    // Modify Currency
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
    });

    it ('Modify Currency - Empty Name', async () => {
        const payload = {
            "name" : "",
            "symbol" : "TC2"
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });

    it ('Modify Currency - Empty Symbol', async () => {
        const payload = {
            "name" : "Test Currency2",
            "symbol" : ""
        };

        const res = await request(app)
            .put(`/api/currency/${new_currency_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });



    // Delete Currency
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
    });

    it ('Delete Currency - Invalid ID', async () => {
        const res = await request(app)
            .delete(`/api/currency/99999`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 404);
    });
  });