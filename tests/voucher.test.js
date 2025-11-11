import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from "../services/currency_service.js";
import { daysFromNow } from "../controller/voucherController.js";
import { getVoucherByCode } from "../services/voucher_service.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'

describe("Voucher Test", () => {
    let admin_access_token;
    let user_access_token;
    let voucher_payload;
    let voucherId;

    let voucherCode;
    let currency;

    before(async () => {
        //Get main Testing Tokens
        user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
        admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");
        try {
            currency = await getCurrencyBySymbol(config.testCurrency);

            voucher_payload = {
                "currencyId": currency.id,
                "amount": 1.5,
                "duration": 360, //in days
            }
        }
        catch (error) {
            console.error("Setup Error: " + error.message);
            throw error
        }
    });

    after(async () => {
        try {
            await prisma.voucher.deleteMany({ where: { Currency: { symbol: currency.symbol } } });
        } catch (error) {
            console.error("Error deleting vouchers:", error);
        }
    })

    it('List All Voucher - User', async () => {
        const res = await request(app)
            .get('/api/voucher')
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('List All Voucher - Admin', async () => {
        const res = await request(app)
            .get('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 200);
    });

    it('Add Voucher - User', async () => {
        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(voucher_payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Add Voucher - Admin', async () => {

        const expiration = daysFromNow(voucher_payload.duration);

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(voucher_payload)

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.id);
        assert.ok(res.body.code);
        assert.equal(res.body.currency, voucher_payload.currency);
        assert.equal(res.body.amount, voucher_payload.amount);
        assert.equal(res.body.expiration, expiration.toISOString());
        assert.equal(res.body.status, "Issued");
        assert.ok(res.body.createdAt);

        voucherCode = res.body.code;
        voucherId = res.body.id;
    });

    it('Add Voucher - Missing Currency ID', async () => {
        const payload = {
            //"currencyId": voucher_payload.currencyId,
            "amount": 1.5,
            "duration": 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Missing Amount', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            //"amount": 1.5,
            "duration": 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Amount too small', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 0.9,
            "duration": 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Amount too big', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 100001,
            "duration": 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Amount string', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": "abc",
            "duration": 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Missing Duration', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 1.5,
            //"duration": 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Duration too short', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 1.5,
            "duration": 1, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Duration too long', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 1.5,
            "duration": 1501, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Duration as string', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 1.5,
            "duration": "abc", //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Duration as float', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 1.5,
            "duration": 5.5, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Other field', async () => {
        const payload = {
            "currencyId": voucher_payload.currencyId,
            "amount": 1.5,
            "duration": 360, //in days
            "other": "field",
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add Voucher - Invalid Currency', async () => {
        const payload = {
            "currencyId": 99998,
            "amount": 1.5,
            "duration": 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Currency not found");
    });

    it('Get Voucher - Admin', async () => {
        const expiration = daysFromNow(voucher_payload.duration);

        const res = await request(app)
            .get(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.code);
        assert.equal(res.body.currency, voucher_payload.currency);
        assert.equal(res.body.amount, voucher_payload.amount);
        assert.equal(res.body.expiration, expiration.toISOString());
        assert.equal(res.body.status, "Issued");
        assert.ok(res.body.createdAt);
    });

    it('Get Voucher - id as string', async () => {
        const expiration = daysFromNow(voucher_payload.duration);

        const res = await request(app)
            .get(`/api/voucher/abc`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Get Voucher - id as float', async () => {
        const expiration = daysFromNow(voucher_payload.duration);

        const res = await request(app)
            .get(`/api/voucher/4.5`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Get Voucher - User', async () => {
        const res = await request(app)
            .get(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Modify Voucher - User', async () => {
        const payload = {
            "duration": 10, //in days
        }

        const res = await request(app)
            .put(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Modify Voucher - Voucher ID not found', async () => {
        const payload = {
            "duration": 10, //in days
        }

        const res = await request(app)
            .put(`/api/voucher/1234568789`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Voucher not found");
    });

    it('Modify Voucher - Admin', async () => {
        const payload = {
            "duration": 10, //in days
        }

        const duration = voucher_payload.duration + payload.duration
        const expiration = daysFromNow(duration);

        const res = await request(app)
            .put(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.code);
        assert.equal(res.body.currency, voucher_payload.currency);
        assert.equal(res.body.amount, voucher_payload.amount);
        assert.equal(res.body.expiration, expiration.toISOString());
        assert.equal(res.body.status, "Issued");
        assert.ok(res.body.createdAt);
    });

    it('Modify Voucher - Duration too short', async () => {
        const payload = {
            "duration": 1, //in days
        }

        const res = await request(app)
            .put(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Modify Voucher - Duration too long', async () => {
        const payload = {
            "duration": 1501, //in days
        }

        const res = await request(app)
            .put(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Modify Voucher - Duration as string', async () => {
        const payload = {
            "duration": "abc", //in days
        }

        const res = await request(app)
            .put(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Modify Voucher - Duration as float', async () => {
        const payload = {
            "duration": 5.9, //in days
        }

        const res = await request(app)
            .put(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Modify Voucher - Other field', async () => {
        const payload = {
            "duration": 10, //in days
            "other": "field",
        }

        const res = await request(app)
            .put(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Delete Voucher - Invalid code', async () => {
        const payload = {
            "duration": 10, //in days
        }

        const res = await request(app)
            .delete(`/api/voucher/123456`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
    });

    it.skip('Claim Voucher - Invalid code', async () => {
        const payload = {
            "code": "123456",
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Voucher not found");
    });

    it.skip('Claim Voucher', async () => {
        const email = config.user1Email;

        const accountBefore = await getAccountByEmailAndCurrencyId(email, voucher_payload.currencyId);
        const balanceBefore = Number(accountBefore.balance);

        const payload = {
            "code": voucherCode,
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Check account balance
        const accountAfter = await getAccountByEmailAndCurrencyId(email, voucher_payload.currencyId);
        const diff = Number(accountAfter.balance) - balanceBefore
        assert.equal(voucher_payload.amount, diff);

        //Check Voucher status
        const voucher = await getVoucherByCode(voucherCode);
        assert.equal(voucher.status, "Claimed");

    });

    it.skip('Claim Voucher - Voucher claimed', async () => {
        const payload = {
            "code": voucherCode,
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.message, "Voucher not available");
    });

});