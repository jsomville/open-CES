import assert from "node:assert";
import request from 'supertest';
import jwt from "jsonwebtoken";

import app from "../app.js";
import config from "./config.test.js";
import { getAccessToken } from "../controller/idpController.js";
//import { getUserByEmail } from '../controller/userController.js';

describe("Test Account", () => {
    //let new_account_id;
    //let account_payload;
    let admin_access_token;
    let user_access_token;

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


        /*const decoded_token = jwt.decode(token);
        console.log(decoded_token);
    
        const accountNumber = ""//await getUserByEmail(decoded_token.sub);
        console.log(accountNumber);
    
        new_account_id = accountNumber;
        account_payload = {
            "userId" : new_account_id,
            "currencyId" : 1
        };*/
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


     // Post - Add Account
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