import assert from "node:assert";
import request from 'supertest';

import app from "../app.js";
import { getUserToken, getAdminToken } from './0-setup.test.js';
import config from "./config.test.js";

describe("Merchant Test", () => {
    let admin_access_token;
    let user_access_token;
    let merchant_payload;
    let new_merchant_id;

    before(async () => {
        //Get main Testing Tokens
        user_access_token = getUserToken();
        admin_access_token = getAdminToken();

        merchant_payload = {
            "name": "Test_Merchant",
            "email": "merchant@opences.org",
            "phone": "+3212345678",
            "region": "EU",
        }
    });

    it('List All Merchant - Admin', async () => {
        const res = await request(app)
            .get('/api/merchant')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 200);
    });

    it('List All Merchant - User', async () => {
        const res = await request(app)
            .get('/api/merchant')
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Add Merchant - Admin', async () => {
        const res = await request(app)
            .post('/api/merchant')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(merchant_payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.name, merchant_payload.name);
        assert.equal(res.body.email, merchant_payload.email);
        assert.equal(res.body.phone, merchant_payload.phone);
        assert.equal(res.body.region, merchant_payload.region);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);

        new_merchant_id = res.body.id;
    });

    it('Add Merchant - No payload', async () => {
        const res = await request(app)
            .post('/api/merchant')
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 422);
    });

    it('Add Merchant - No Name', async () => {
        const payload = {
            //"name" : "Test_Merchant",
            "email": "merchant@opences.org",
            "phone": "+3212345678",
            "region": "EU",
        }
        const res = await request(app)
            .post('/api/merchant')
            .set('Authorization', `Bearer ${admin_access_token}`)
        //.send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Name field mandatory");
    });

    it('Add Merchant - No Email', async () => {
        const payload = {
            "name": "Test_Merchant",
            //"email" : "merchant@opences.org",
            "phone": "+3212345678",
            "region": "EU",
        }
        const res = await request(app)
            .post('/api/merchant')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Email field mandatory");
    });

    it('Add Merchant - No Phone', async () => {
        const payload = {
            "name": "Test_Merchant",
            "email": "merchant@opences.org",
            //"phone" : "+3212345678",
            "region": "EU",
        }
        const res = await request(app)
            .post('/api/merchant')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Phone field mandatory");
    });

    it('Add Merchant - No Region', async () => {
        const payload = {
            "name": "Test_Merchant",
            "email": "merchant@opences.org",
            "phone": "+3212345678",
            //"region" : "EU",
        }
        const res = await request(app)
            .post('/api/merchant')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Region field mandatory");
    });

    it('Get Merchant - Admin', async () => {
        const res = await request(app)
            .get(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.name, merchant_payload.name);
        assert.equal(res.body.email, merchant_payload.email);
        assert.equal(res.body.phone, merchant_payload.phone);
        assert.equal(res.body.region, merchant_payload.region);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);
    });

    it('Get Merchant - Invalid Id', async () => {
        const res = await request(app)
            .get(`/api/merchant/125458`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
    });

    it('Get Merchant - User', async () => {
        const res = await request(app)
            .get(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 403);
    });

    it('Modify Merchant - Admin', async () => {
        const payload = {
            "name": "new name",
            "email": "email@opences.org",
            "phone": "+328529637",
            "region": "BXL",
        }
        const res = await request(app)
            .put(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.name, payload.name);
        assert.equal(res.body.email, payload.email);
        assert.equal(res.body.phone, payload.phone);
        assert.equal(res.body.region, payload.region);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);
    });

    it('Modify Merchant - No Name', async () => {
        const payload = {
            //"name" : "new name",
            "email": "email@opences.org",
            "phone": "+328529637",
            "region": "BXL",
        }
        const res = await request(app)
            .put(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });

    it('Modify Merchant - No Name', async () => {
        const payload = {
            //"name" : "new name",
            "email": "email@opences.org",
            "phone": "+328529637",
            "region": "BXL",
        }
        const res = await request(app)
            .put(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Name field mandatory");
    });


    it('Modify Merchant - No Email', async () => {
        const payload = {
            "name": "new name",
            //"email" : "email@opences.org",
            "phone": "+328529637",
            "region": "BXL",
        }
        const res = await request(app)
            .put(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Email field mandatory");
    });


    it('Modify Merchant - No Phone', async () => {
        const payload = {
            "name": "new name",
            "email": "email@opences.org",
            //"phone" : "+328529637",
            "region": "BXL",
        }
        const res = await request(app)
            .put(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Phone field mandatory");
    });

    it('Modify Merchant - No Region', async () => {
        const payload = {
            "name": "new name",
            "email": "email@opences.org",
            "phone": "+328529637",
            //"region" : "BXL",
        }
        const res = await request(app)
            .put(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Region field mandatory");
    });




    it('Delete Merchant - Admin', async () => {
        const res = await request(app)
            .delete(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);
    });

    it('Delete Merchant - User', async () => {
        const res = await request(app)
            .delete(`/api/merchant/${new_merchant_id}`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
    });
});