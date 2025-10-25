import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'

describe("Test Account Extra", () => {
    let admin_access_token;
    let user_access_token;

    before(async () => {
        //Get main Testing Tokens
        user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
        admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

        //config.testCurrency

    });

    after(async () => {

    });

    /********************************* */
    // Get Account By Email and Symbol
    /********************************* */

    it('Get Account By Email and Symbol - Admin', async () => {
        const payload = {
            "email": config.user1Email,
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-email-and-symbol')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.id);
        assert.ok(res.body.firstname);
        assert.ok(res.body.lastname);
    });

    it('Get Account By Email and Symbol - User', async () => {
        const payload = {
            "email": config.user1Email,
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-email-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.id);
        assert.ok(res.body.firstname);
        assert.ok(res.body.lastname);
    });

    it('Get Account By Email and Symbol - no Email', async () => {
        const payload = {
            //"email": config.user1Email,
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-email-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 400);
    });

    it('Get Account By Email and Symbol - no Symbol', async () => {
        const payload = {
            "email": "invalid@email.com",
            //"symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-email-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 400);
    });

    it('Get Account By Email and Symbol - invalid mail', async () => {
        const payload = {
            "email": "invalid@email.com",
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-email-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 404);
    });

    it('Get Account By Email and Symbol - invalid symbol', async () => {
        const payload = {
            "email": config.user1Email,
            "symbol": "ISYM"
        };
        const res = await request(app)
            .post('/api/account/by-email-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 404);
    });

    /********************************* */
    // Get Account By Phone and Symbol
    /********************************* */

    it('Get Account By Phone and Symbol - Admin', async () => {
        const payload = {
            "phone": config.user1Phone,
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-phone-and-symbol')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.id);
        assert.ok(res.body.firstname);
        assert.ok(res.body.lastname);
    });

    it('Get Account By Phone and Symbol - User', async () => {
        const payload = {
            "phone": config.user1Phone,
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-phone-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.id);
        assert.ok(res.body.firstname);
        assert.ok(res.body.lastname);
    });

    it('Get Account By Phone and Symbol - No phone', async () => {
        const payload = {
            //"phone": config.user1Phone,
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-phone-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 400);
    });

     it('Get Account By Phone and Symbol - No symbol', async () => {
        const payload = {
            "phone": config.user1Phone,
            //"symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-phone-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 400);
    });

     it('Get Account By Phone and Symbol - Invalid phone', async () => {
        const payload = {
            "phone": "000000000",
            "symbol": config.testCurrency
        };
        const res = await request(app)
            .post('/api/account/by-phone-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 404);
    });

    it('Get Account By Phone and Symbol - Invalid symbol', async () => {
        const payload = {
            "phone": config.user1Phone,
            "symbol":"ISYM"
        };
        const res = await request(app)
            .post('/api/account/by-phone-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 404);
    });
});