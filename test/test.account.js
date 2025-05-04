import { describe, it } from "node:test";
import assert from "node:assert";
import request from 'supertest';
import jwt from "jsonwebtoken";

import app from "../app.js";
import { admin_access_token, user_access_token } from './test.setup.js';

import { getUserByEmail } from '../controller/userController.js';

let new_account_id;
let account_payload;

before(() => {
    console.log("account - before all");

    //const token = user_access_token;
    /*const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqYW5lLmRvZUBlbWFpbC5jb20iLCJqdGkiOiJiZjYxMGE3MS0yYWJiLTQ4MTktYjhmOS1kYWViMTRmMzNlOTMiLCJyb2xlIjoiYWRtaW4iLCJhdWQiOiJPcGVuQ0VTIiwiaWF0IjoxNzQ2Mjk0NDc3LCJleHAiOjE3NDYyOTc0NzcsImlzcyI6Ik9wZW4tQ0VTIn0.Al_JAJTmLm4RAbVpCswB-g5C2KEB83VyT6jASec0hCY";
    console.log(token);
    
    const decoded_token = jwt.decode(token);
    console.log(decoded_token);

    const accountNumber = await getUserByEmail(decoded_token.sub);
    console.log(accountNumber);

    new_account_id = accountNumber;
    account_payload = {
        "userId" : new_account_id,
        "currencyId" : 1
    };*/
});

describe("Test Account", () => {

    it('List all Account - Admin', async () => {
        const res = await request(app)
            .get('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 200);
        console.log(res.body);
    });

    it('List all Account - User', async () => {
        const res = await request(app)
            .get('/api/account')
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });


     // Post - Add currency
     /*it('Add account- User', async () => {
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(account_payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.name, currency_payload.name);
        assert.equal(res.body.symbol, currency_payload.symbol);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)

        new_account_id = res.body.id
    });*/
});