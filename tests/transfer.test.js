import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { createUser, getUserByEmail, removeUser } from "../services/user_service.js";
import { getAccessTokenByEmailAndRole, getAccessToken } from "../services/auth_service.js";
import { createPersonnalAccount, getAccountByNumber, getUserAccounts, removeAccount } from "../services/account_service.js";
import { getCurrencyBySymbol } from "../services/currency_service.js";

describe("Test Transfer", () => {
    let user1Token;
    let user2Token;

    let currency;
    const user1Email = "transfer_user1@test.com";
    const user2Email = "transfer_user2@test.com";
    let user1;
    let user2;
    let account1;
    let account2;
    const fundAmount = 2.24;
    const transferAmount = 1.11;

    const otherCurrencySymbol = "CES";


    before(async () => {
        try {
            // Get test currency
            currency = await getCurrencyBySymbol(config.testCurrency);
            if (!currency) {
                throw new Error("Test currency not found");
            }

            // Clean up existing test users
            let existingUser1 = await getUserByEmail(user1Email);
            if (existingUser1) {
                const accounts = await getUserAccounts(existingUser1.id);
                for (const account of accounts) {
                    await prisma.transaction.deleteMany({ where: { OR: [{ fromAccountId: account.id }, { toAccountId: account.id }] } });
                    await prisma.personalAccount.deleteMany({ where: { accountNumber: account.number } });
                    await removeAccount(account.number);
                }
                await removeUser(existingUser1.id);
            }

            let existingUser2 = await getUserByEmail(user2Email);
            if (existingUser2) {
                const accounts = await getUserAccounts(existingUser2.id);
                for (const account of accounts) {
                    await prisma.transaction.deleteMany({ where: { OR: [{ fromAccountId: account.id }, { toAccountId: account.id }] } });
                    await prisma.personalAccount.deleteMany({ where: { accountNumber: account.number } });
                    await removeAccount(account.number);
                }
                await removeUser(existingUser2.id);
            }

            // Create test users
            user1 = await createUser(user1Email, "+32123456999", "FAKE_HASH", "user", "Transfer", "User1");
            user2 = await createUser(user2Email, "+32123456888", "FAKE_HASH", "user", "Transfer", "User2");

            // Create accounts for users
            account1 = await createPersonnalAccount(user1, currency.symbol);


            // Fund user1's account
            await prisma.account.update({
                where: { number: account1.number },
                data: { balance: fundAmount },
            });

            account2 = await createPersonnalAccount(user2, currency.symbol);

            // Create tokens
            user1Token = getAccessToken({ email: user1Email, role: "user" });
            user2Token = getAccessToken({ email: user2Email, role: "user" });
        }
        catch (error) {
            console.log("Setup Error:", error.message);
        }
    });

    after(async () => {
        try {
            // Clean up user1
            1
            await prisma.transaction.deleteMany({ where: { accountNumber: account1.number } });
            await prisma.personalAccount.deleteMany({ where: { accountNumber: account1.number } });
            await removeAccount(account1.number);

            await removeUser(user1.id);


            // Clean up user2

            await prisma.transaction.deleteMany({ where: { accountNumber: account2.number } });
            await prisma.personalAccount.deleteMany({ where: { accountNumber: account2.number } });
            await removeAccount(account2.number);

            await removeUser(user2.id);

        } catch (error) {
            console.log("Cleanup Error:", error.message);
        }
    });

    it('Transfer - Account Missing', async () => {
        const payload = {
            //number : account2.number,
            amount: transferAmount,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Transfer - Amount Missing', async () => {
        const payload = {
            number: account2.number,
            //amount : transferAmount,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Transfer - Amount Must be a positive number', async () => {
        const payload = {
            number: account2.number,
            amount: -5,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Transfer - Destination account not found', async () => {
        const payload = {
            number: "265-9999-99999",
            amount: transferAmount,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)
        
        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Destination account not found");
    });

    it('Transfer - Source account not found', async () => {
        const payload = {
            number: account2.number,
            amount: transferAmount,
        }

        const res = await request(app)
            .post(`/api/account/265-9999-99999/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)
        
        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Source account not found");
    });

    it('Transfer - Account not the same currency', async () => {
        // NOTE: This test requires a second currency to be set up
        // Skipping for now as both test accounts use the same currency (TCES)

        //Get an other account currency
        const currency = await getCurrencyBySymbol(otherCurrencySymbol);
        if(!currency) {
            throw new Error("Other currency not found");
        }
        
        const otherAccountNumber = currency.mainCurrencyAccountNumber;

        const payload = {
            number: otherAccountNumber,
            amount: transferAmount,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Accounts must be from the same currency");
    });

    it('Transfer - Insufficient funds', async () => {
        const payload = {
            number: account2.number,
            amount: 1000,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)
        
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, "Insufficient funds");
    });

    it('Transfer - Self', async () => {
        const payload = {
            number: account1.number,
            amount: 1,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Cannot transfer to same account");
    });

    it('Transfer - Not own account', async () => {
        const payload = {
            number: account1.number,
            amount: 1,
        }

        const res = await request(app)
            .post(`/api/account/${account2.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)
        
        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Account must be owned by current user");
    });

    it('Transfer - Valid', async () => {
        let account;
        account = await getAccountByNumber(account1.number);
        const account1Balance = account.balance;

        account = await getAccountByNumber(account2.number);
        const account2Balance = account.balance;

        const payload = {
            number: account2.number,
            amount: transferAmount,
        }

        const res = await request(app)
            .post(`/api/account/${account1.number}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account1 Balance
        account = await getAccountByNumber(account1.number);
        const balance1 = (Number(account1Balance) - Number(transferAmount)).toFixed(2);
        assert.equal(account.balance, balance1, "Account 1 Balance");

        //Get the account2 Balance
        account = await getAccountByNumber(account2.number);
        const balance2 = (Number(account2Balance) + Number(transferAmount)).toFixed(2);
        assert.equal(account.balance, balance2, "Account 2 balance");
    });
})
