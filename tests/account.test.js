import assert from "node:assert";
import request from 'supertest';
import jwt from "jsonwebtoken";

import app from "../app.js";
import config from "./config.test.js";
import { getAccessToken } from "../controller/idpController.js";
import { getUserByEmail } from '../controller/userController.js';

describe("Test Account", () => {
    let new_account_id;
    let account_payload;
    let admin_access_token;
    let user_access_token;
    let user_id;

    before(async () => {
        //Wait for 1 sec --> bug before
        await new Promise(resolve => setTimeout(resolve, 500)); // 1 second

        //console.log("Account - Before")
        
        // Create User Token
        const user_token_parameters = {
            "email" : config.userEmail,
            "role" : "user"
        }
        user_access_token = getAccessToken(user_token_parameters)
        
        //console.log(global.uat)

        // Create Admin Token
        const admin_token_parameters = {
            "email" : config.adminEmail,
            "role" : "admin"
        }
        admin_access_token = getAccessToken(admin_token_parameters);

        //console.log(global.aat)

        // New stuff
        const user = await getUserByEmail(config.userEmail);
        user_id = user.id;
        // Create payload
        account_payload = {
            "userId" : user.id,
            "currencyId" : 1
        };
        
    });

    it('List all Account - Admin', async () => {
        const res = await request(app)
            .get('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 200);
    });

    it('List all Account - User', async () => {
        const res = await request(app)
            .get('/api/account')
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

     it('Add user account - Admin', async () => {
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(account_payload)

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.id);
        assert.equal(res.body.userId, user_id);
        assert.equal(res.body.merchantId, null);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)

        new_account_id = res.body.id;
    });

    it('Add user account - User', async () => {
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(account_payload)

        assert.equal(res.statusCode, 403);
    });

    it('Add user account - No payload', async () => {
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 422);
    });

    it('Add user account - No UserID', async () => {
        const payload = {
            //"userId" : user.id,
            "currencyId" : 1
        };
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });

    it('Add user account - No Currency', async () => {
        const payload = {
            "userId" : user_id,
            //"currencyId" : 1
        };
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
    });

    it('Get user account - Admin', async () => {
        const res = await request(app)
            .get(`/api/account/${new_account_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.id);
        assert.equal(res.body.userId, user_id);
        assert.equal(res.body.merchantId, null);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    it('Get user account - User', async () => {
        const res = await request(app)
            .get(`/api/account/${new_account_id}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 403);
    });

    it('Delete Account - admin', async () => {
        const res = await request(app)
            .delete(`/api/account/${new_account_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
        
        assert.equal(res.statusCode, 204);
    });
});