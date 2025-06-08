import assert from "node:assert";
import request from 'supertest';

import app from "../app.js";
import { getUserToken, getAdminToken } from './0-setup.test.js';

describe.skip("Voucher Test", () => {
    let admin_access_token;
    let user_access_token;
    let voucher_payload;
    let new_voucher_id;

    before(async () => {
        //Get main Testing Tokens
        user_access_token = getUserToken();
        admin_access_token = getAdminToken();

        voucher_payload = {
            "code": "Code 1234",
            "currency": 1,
            "amount": 1.5,
            "expiration": "",
        }
    });

    it('List All Voucher - Admin', async () => {
        const res = await request(app)
            .get('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 200);
    });

    it('List All Voucher - User', async () => {
        const res = await request(app)
            .get('/api/voucher')
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
    });

    it.skip('Add Voucher - Admin', async () => {
        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(voucher_payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.code, voucher_payload.code);
        assert.equal(res.body.currency, voucher_payload.currency);
        assert.equal(res.body.amount, voucher_payload.amount);
        assert.equal(res.body.expiration, voucher_payload.expiration);
        assert.equal(res.body.status, voucher_payload.status);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);

        new_merchant_id = res.body.id;
    });
});