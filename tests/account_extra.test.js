import assert from "node:assert";
import request from 'supertest';

import argon2 from 'argon2';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js';
import { createPersonnalAccount } from '../services/account_service.js';
import { getUserByEmail, createUser, removeUser } from '../services/user_service.js';
import { getCurrencyBySymbol } from '../services/currency_service.js';
import { AccountType } from '../utils/accountUtil.js';

describe("Test Account Extra", () => {
    let admin_access_token;
    let user_access_token;
    let user_token;

    let testUser;
    let testCurrency;
    let personalAccount;
    let test_currency

    const testUserEmail = "account_extra_test@test.com";

    before(async () => {
        try {
            //Get main Testing Tokens
            user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
            admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

            test_currency = await getCurrencyBySymbol(config.testCurrency);

            testUser = await getUserByEmail(testUserEmail);
            if (testUser) {
                await removeUser(testUser.id);
            }
            const userInfo = {
                email: testUserEmail,
                phone: "5551234567",
                password: "TestPass123!",
                role: "user",
                firstname: "Firstname",
                lastname: "Lastname"
            }
            // Create test user
            const hashedPassword = await argon2.hash(userInfo.password);
            testUser = await createUser(userInfo.email, userInfo.phone, hashedPassword, userInfo.role, userInfo.firstname, userInfo.lastname);

            user_token = getAccessTokenByEmailAndRole(testUser.email, "user");

            // Get test currency
            testCurrency = await getCurrencyBySymbol(config.testCurrency);

            // Create Personnal Account
            personalAccount = await createPersonnalAccount(testUser, config.testCurrency);

            //Create Transactions
            for (let i = 0; i < 15; i++) {
                await prisma.transaction.create({
                    data: {
                        accountNumber: personalAccount.number,
                        currencyId: testCurrency.id,
                        amount: 50 + i,
                        description: `Test Transaction Extra ${i + 1}`,
                        status: "Completed",
                        transactionType: "Test"
                    }
                });
            }
        }
        catch (error) {
            console.error("Error in before hook Account Extra Test: " + error.message);
            throw error;
        }
    });

    after(async () => {
        try {

            // Cleanup
            if (personalAccount) {
                await prisma.transaction.deleteMany({ where: { accountNumber: personalAccount.number } });
            }

            await prisma.personalAccount.deleteMany({ where: { Account: { currencyId: test_currency.id } } });
            await prisma.account.deleteMany({ where: { currencyId: test_currency.id, accountType: AccountType.PERSONAL } });

            await removeUser(testUser.id);
        } catch (error) {
            console.error("Cleanup error:", error);
        }
    });

    /********************************* */
    // Get Account By Email and Symbol
    /********************************* */

    it('Get Account By Email and Symbol - Admin', async () => {
        const payload = {
            "email": testUser.email,
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
            "email": testUser.email,
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
            "phone": testUser.phone,
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
            "phone": testUser.phone,
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
            "symbol": "ISYM"
        };
        const res = await request(app)
            .post('/api/account/by-phone-and-symbol')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload);

        assert.equal(res.statusCode, 404);
    });

    /********************************* */
    // Get Account Transactions
    /********************************* */
    it('Get Account Transactions - Admin', async () => {
        const res = await request(app)
            .get(`/api/account/${personalAccount.number}/transactions`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send();
        
        assert.equal(res.statusCode, 200);
        assert.ok(Array.isArray(res.body));
    });

    it('Get Account Transactions - User', async () => {
        const res = await request(app)
            .get(`/api/account/${personalAccount.number}/transactions`)
            .set('Authorization', `Bearer ${user_token}`)
            .send();
        
        assert.equal(res.statusCode, 200);
        assert.ok(Array.isArray(res.body));
    });

    it('Get Account Transactions - Admin By Pages', async () => {
        const page = 1;
        const limit = 5;

        const res = await request(app)
            .get(`/api/account/${personalAccount.number}/transactions-by-page?page=${page}&limit=${limit}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send();

        assert.equal(res.statusCode, 200);
        assert.ok(Array.isArray(res.body.transactions));
        assert.ok(res.body.pagination);
        assert.equal(res.body.pagination.currentPage, page);
        assert.equal(res.body.pagination.totalCount, limit);
    });

    it('Get Account Transactions - By Pages', async () => {
        const page = 1;
        const limit = 5;

        const res = await request(app)
            .get(`/api/account/${personalAccount.number}/transactions-by-page?page=${page}&limit=${limit}`)
            .set('Authorization', `Bearer ${user_token}`)
            .send();
        
        assert.equal(res.statusCode, 200);
        assert.ok(Array.isArray(res.body.transactions));
        assert.ok(res.body.pagination);
        assert.equal(res.body.pagination.currentPage, page);
        assert.equal(res.body.pagination.totalCount, limit);
    });

});