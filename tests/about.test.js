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

});