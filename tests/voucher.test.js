import assert from "node:assert";
import request from 'supertest';

import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from "../services/currency_service.js";
import { daysFrom, daysFromNow } from "../controller/voucherController.js";
import { VoucherStatus, createVoucher, getVoucherByCode, claimVoucherService } from "../services/voucher_service.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'
import { getUserByEmail, createUser, removeUser } from "../services/user_service.js";
import { getAccountByNumber, createPersonnalAccount } from "../services/account_service.js";
import { AccountType } from '../utils/accountUtil.js';

describe("Voucher Test", () => {
    let admin_access_token;
    let user_access_token;
    let voucher_payload;
    let voucherId;

    let currency;
    let testUser;
    let user_token;
    let personalAccount;

    const testUserEmail = "voucherTest@test.com";

    before(async () => {
        try {
            //Get main Testing Tokens
            user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
            admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

            currency = await getCurrencyBySymbol(config.testCurrency);

            testUser = await getUserByEmail(testUserEmail);
            if (testUser) {
                await removeUser(testUser.id);
            }
            const userInfo = {
                email: testUserEmail,
                phone: "6551234567",
                password: "TestPass123!",
                role: "user",
                firstname: "Voucher",
                lastname: "Test"
            }
            // Create test user
            const hashedPassword = await argon2.hash(userInfo.password);
            testUser = await createUser(userInfo.email, userInfo.phone, hashedPassword, userInfo.role, userInfo.firstname, userInfo.lastname);

            user_token = getAccessTokenByEmailAndRole(testUser.email, "user");

            // Create Personnal Account
            personalAccount = await createPersonnalAccount(testUser, config.testCurrency);

            voucher_payload = {
                currencyId: currency.id,
                amount: 1.5,
                duration: 360, //in days
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

            // Cleanup
            if (personalAccount) {
                await prisma.transaction.deleteMany({ where: { accountNumber: personalAccount.number } });
            }

            await prisma.personalAccount.deleteMany({ where: { Account: { currencyId: currency.id } } });
            await prisma.account.deleteMany({ where: { currencyId: currency.id, accountType: AccountType.PERSONAL } });

            await removeUser(testUser.id);

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

        const payload = {
            currencyId: currency.id,
            amount: 1.5,
            duration: 360, //in days
        }

        const expiration = daysFromNow(payload.duration);

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.id);
        assert.ok(res.body.code);
        assert.equal(res.body.currencyId, payload.currencyId);
        assert.equal(res.body.amount, payload.amount);
        assert.equal(res.body.expiration, expiration.toISOString());
        assert.equal(res.body.status, VoucherStatus.ISSUED);
        assert.ok(res.body.createdAt);

        voucherId = res.body.id;
    });

    it('Add Voucher - Missing Currency ID', async () => {
        const payload = {
            //currencyId: currency.id,
            amount: 1.5,
            duration: 360, //in days
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
            currencyId: currency.id,
            //amount: 1.5,
            duration: 360, //in days
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
            currencyId: currency.id,
            amount: 0.9,
            duration: 360, //in days
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
            currencyId: currency.id,
            amount: 100001,
            duration: 360, //in days
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
            currencyId: currency.id,
            amount: "abc",
            duration: 360, //in days
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
            currencyId: currency.id,
            amount: 1.5,
            //duration: 360, //in days
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
            currencyId: currency.id,
            amount: 1.5,
            duration: 1, //in days
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
            currencyId: currency.id,
            amount: 1.5,
            duration: 1501, //in days
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
            currencyId: currency.id,
            amount: 1.5,
            duration: "abc", //in days
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
            currencyId: currency.id,
            amount: 1.5,
            duration: 5.5, //in days
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
            currencyId: currency.id,
            amount: 1.5,
            duration: 360, //in days
            other: "field",
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
            currencyId: 99998,
            amount: 1.5,
            duration: 360, //in days
        }

        const res = await request(app)
            .post('/api/voucher')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Currency not found");
    });

    it('Get Voucher - id as string', async () => {
        const res = await request(app)
            .get(`/api/voucher/abc`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Get Voucher - id as float', async () => {
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

    it('Get Voucher - Admin', async () => {
        const expiration = daysFromNow(voucher_payload.duration);

        const res = await request(app)
            .get(`/api/voucher/${voucherId}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.code);
        assert.equal(res.body.currencyId, currency.id);
        assert.equal(res.body.amount, voucher_payload.amount);
        assert.equal(res.body.expiration, expiration.toISOString());
        assert.equal(res.body.status, VoucherStatus.ISSUED);
        assert.ok(res.body.createdAt);
    });

    /***********************    */
    // Modify Voucher Tests
    /***********************    */

    it('Modify Voucher - User', async () => {
        const payload = {
            duration: 10, //in days
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
            duration: 10, //in days
        }

        const res = await request(app)
            .put(`/api/voucher/1234568789`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Voucher not found");
    });



    it('Modify Voucher - Duration too short', async () => {
        const payload = {
            duration: 1, //in days
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
            duration: 1501, //in days
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
            duration: "abc", //in days
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
            duration: 5.9, //in days
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
            duration: 10, //in days
            other: "field",
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

    it('Modify Voucher - Admin', async () => {
        //Create a Voucher to claim
        const code = uuidv4()
        const amount = 2.22;
        const validDays = 1;
        const voucher = await createVoucher(code, amount, currency.id, daysFromNow(validDays));

        const payload = {
            duration: 10, //in days
        }

        const expiration = daysFrom(voucher.expiration, payload.duration);

        const res = await request(app)
            .put(`/api/voucher/${voucher.id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.code);
        assert.equal(res.body.currencyId, currency.id);
        assert.equal(res.body.amount, amount);
        assert.equal(res.body.expiration, expiration.toISOString());
        assert.equal(res.body.status, VoucherStatus.ISSUED);
        assert.ok(res.body.createdAt);
    });

    it('Modify Voucher - Claimed Voucher', async () => {
        //Create a Voucher to claim
        const code = uuidv4()
        const amount = 2.22;
        const validDays = 30;
        const voucher = await createVoucher(code, amount, currency.id, daysFromNow(validDays));

        // set Claimed status
        await prisma.voucher.update({
            data: {
                status: VoucherStatus.REDEEMED
            },
            where: {
                id: voucher.id
            }
        })

        const payload = {
            duration: 10, //in days
        }

        const res = await request(app)
            .put(`/api/voucher/${voucher.id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.message, "Voucher not modifiable");
    });

    it('Delete Voucher - API not found', async () => {
        const payload = {
            duration: 10, //in days
        }

        const res = await request(app)
            .delete(`/api/voucher/123456`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
    });

    /*********************** */
    // Voucher Claim Tests
    /*********************** */

    it('Claim Voucher - No Code', async () => {
        const payload = {
            //code: "123456",
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Claim Voucher - code as int', async () => {
        const payload = {
            code: 123456,
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Claim Voucher - code as string', async () => {
        const payload = {
            code: "abcd1234",
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Claim Voucher - Code not found', async () => {

        const payload = {
            code: uuidv4(),
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Voucher not found");
    });

    it('Claim Voucher', async () => {
        //Create a Voucher to claim
        const code = uuidv4()
        const amount = 2.33;
        const newVoucher = await createVoucher(code, amount, currency.id, daysFromNow(2));

        const balanceBefore = Number(personalAccount.balance);

        const payload = {
            code: code,
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${user_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Check account balance
        const updatedAccount = await getAccountByNumber(personalAccount.number);
        const diff = Number(updatedAccount.balance) - balanceBefore
        assert.equal(newVoucher.amount, diff);

        //Check Voucher status
        const voucher = await getVoucherByCode(code);
        assert.equal(voucher.status, VoucherStatus.REDEEMED);

    });

    it('Claim Voucher - claimed voucher', async () => {
        const email = config.user1Email;

        //Create a Voucher to claim
        const code = uuidv4()
        const expiration = daysFromNow(1);
        const amount = 2.33;

        const voucher = await createVoucher(code, amount, currency.id, expiration);

        //Set voucher claimed
        await prisma.voucher.update({
            data: {
                status: VoucherStatus.REDEEMED
            },
            where: {
                id: voucher.id
            }
        });

        const payload = {
            code: code,
        }

        const res = await request(app)
            .post(`/api/voucher/claim`)
            .set('Authorization', `Bearer ${user_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.message, "Voucher not available");

    });

});