import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";

describe("Test About", () => {

    before(async () => {

    });

    after(async () => {

    });

    it('About - Mobile App Version', async () => {
        const res = await request(app)
            .get('/api/about/mobileAppVersion')

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.mobileAppVersion);
    });

    it('About - Currencies', async () => {
        const res = await request(app)
            .get('/api/about/currencies')

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.currencies);
        if (Array.isArray(res.body) && res.body.length) {
            const item = res.body[0];
            assert.ok(!('symbol' in item));
            assert.ok(!('name' in item));
            assert.ok(!('country' in item));
            assert.ok(!('regionList' in item));
            assert.ok(!('logoURL' in item));
            assert.ok(!('newAccountWizardURL' in item));
            assert.ok(!('androidAppURL' in item));
            assert.ok(!('iphoneAppURL' in item));
            assert.ok(!('androidAppLatestVersion' in item));
            assert.ok(!('iphoneAppLatestVersion' in item));
        }
    });

});