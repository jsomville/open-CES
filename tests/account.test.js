import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from '../services/currency_service.js'
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'
import { createUser } from '../services/user_service.js';
import { createAccount } from '../services/account_service.js';
import { AccountType } from "../utils/accountUtil.js";

describe("Test Account", () => {

    let admin_access_token;
    let user_access_token;
    let user_id;
    let test_currency

    let personnal_account_number;

    const userEmail = "account.test@openced.org";

    before(async () => {
        //Get main Testing Tokens
        user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
        admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

        try {
            test_currency = await getCurrencyBySymbol(config.testCurrency);

            await prisma.user.deleteMany({ where: { email: userEmail } });

            //Create User related to account creation
            const userData = {
                firstname: "John",
                lastname: "Doe",
                email: userEmail,
                phone: "+32471041010",
                region: "EU",
                passwordHash: "FAKE",
                role: "user"
            }
            const user = await createUser(userData.email, userData.phone, userData.passwordHash, userData.role, userData.firstname, userData.lastname);

            if (!user) {
                throw new Error("Account Test - Before - User not found")
            }
            user_id = user.id;

        } catch (error) {
            console.error("Account Test - Before error: " + error.message);
            throw error;
        }
    });

    after(async () => {
        // Cleanup test data

        await prisma.personalAccount.deleteMany({ where: { Account: { currencyId: test_currency.id } } });
        await prisma.merchantAccount.deleteMany({ where: { Account: { currencyId: test_currency.id } } });

        await prisma.account.deleteMany({ where: { currencyId: test_currency.id, accountType: AccountType.PERSONAL } });
        await prisma.account.deleteMany({ where: { currencyId: test_currency.id, accountType: AccountType.MERCHANT } });


        await prisma.user.deleteMany({ where: { email: userEmail } });
    });

    /********************************* */
    // List  Account
    /********************************* */

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
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    /********************************* */
    // Add Account
    /********************************* */
    it('Add Personnal account - User', async () => {
        const payload = {
            ownerId: user_id,
            symbol: config.testCurrency,
            accountType: AccountType.PERSONAL,
        };

        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Add Personnal account - Admin', async () => {
        const payload = {
            ownerId: user_id,
            symbol: config.testCurrency,
            accountType: AccountType.PERSONAL,
        };

        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.number);
        assert.equal(res.body.currencyId, test_currency.id);
        assert.equal(res.body.accountType, payload.accountType);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);

        personnal_account_number = res.body.number;
    });

    it('Add account - Currency not found', async () => {
        const payload = {
            ownerId: user_id,
            symbol: "ABCD",
            accountType: AccountType.PERSONAL,
        };

        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Currency not found");
    });

    it('Add account - User does not exist (FK)', async () => {
        const payload = {
            ownerId: 9999999,
            symbol: config.testCurrency,
            accountType: AccountType.PERSONAL,
        };

        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "User not found");
    });


    it('Add account - No payload', async () => {
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Add account - No UserID', async () => {
        const payload = {
            //ownerId : user.id,
            symbol: config.testCurrency,
            accountType: AccountType.PERSONAL,
        };
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add account - No Currency', async () => {
        const payload = {
            ownerId: user_id,
            //symbol: config.testCurrency,
            accountType: AccountType.PERSONAL,
        };
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add account - Other field', async () => {
        const payload = {
            ownerId: user_id,
            symbol: config.testCurrency,
            accountType: AccountType.PERSONAL,
            "some field": "blabla"
        };

        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add account - No Account Type', async () => {
        const payload = {
            ownerId: user_id,
            symbol: config.testCurrency,
            //accountType : AccountType.PERSONAL,
        };
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add account - Other Account Type', async () => {
        const payload = {
            ownerId: user_id,
            symbol: config.testCurrency,
            accountType: 99,
        };
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add account - account already exist for this currency', async () => {
        const payload = {
            ownerId: user_id,
            symbol: config.testCurrency,
            accountType: AccountType.PERSONAL,
        };
        const res = await request(app)
            .post('/api/account')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, "Account for this user and this currency already exists")
    });

    /********************************* */
    // Get  Account
    /********************************* */

    it('Get account - Admin', async () => {
        const res = await request(app)
            .get(`/api/account/${personnal_account_number}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.number);
        assert.equal(res.body.currencyId, test_currency.id);
        assert.equal(res.body.balance, 0);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    it('Get account - Not found', async () => {
        const accountNumber = "145-0004-00005";
        const res = await request(app)
            .get(`/api/account/${accountNumber}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Account not found");
    });

    it('Get account - User', async () => {
        const res = await request(app)
            .get(`/api/account/${personnal_account_number}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Get account - Account is integer', async () => {
        const res = await request(app)
            .get(`/api/account/123`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Get account - Account is float', async () => {
        const res = await request(app)
            .get(`/api/account/4.5`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Get account - Account is wrongformat', async () => {
        const res = await request(app)
            .get(`/api/account/000_0000_00000`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    /********************************* */
    // Delete  Account
    /********************************* */

    it('Delete Account - user', async () => {
        const res = await request(app)
            .delete(`/api/account/${personnal_account_number}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Delete Account - account is string', async () => {
        const res = await request(app)
            .delete(`/api/account/abc`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Delete Account - account is float', async () => {
        const res = await request(app)
            .delete(`/api/account/4.5`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Delete Account - admin', async () => {

        const account = await createAccount(config.testCurrency, AccountType.PERSONAL);

        const res = await request(app)
            .delete(`/api/account/${account.number}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 204);
    });

    it('Delete Account - Not found', async () => {
        const res = await request(app)
            .delete(`/api/account/149-0004-00009`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Account not found");
    });

    it('Delete Account - Balance must be zero', async () => {

        // Create a new account for current user
        const account = await createAccount(config.testCurrency, AccountType.PERSONAL);

        // Set Fund account
        await prisma.account.update({ where: { number: account.number }, data: { balance: 1 } });

        const res = await request(app)
            .delete(`/api/account/${account.number}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, "Balance must be zero");

        // cleanup: reset balance to allow delete
        await prisma.account.delete({ where: { number: account.number } });
    })

});

