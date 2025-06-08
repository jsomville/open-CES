import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import app from "../app.js";
import config from "./config.test.js";
import { getUserToken, getAdminToken } from './0-setup.test.js';
import { getCurrencyBySymbol } from '../controller/currencyController.js';
import { createUserAndAccount, deleteUserAndAccount, getAccountIdByEmailAndCurrencySymbol } from "../controller/helper.js";

describe("Test Currency", () => {
    let admin_access_token;
    let user_access_token;

    let currency_id;
    const symbol = "AAA";
    const user1Email = "user1@AAA.com"
    const user2Email = "user2@AAA.com"
    let user1AccountId;
    let user2AccountId;
    const fundAmount = 2.22;
    const transferAmount = 1.11;

    before(async () => {
        try {
            //Get main Testing Tokens
            user_access_token = getUserToken();
            admin_access_token = getAdminToken();

            //Get currency if exist
            let currency = await prisma.currency.findUnique({ where: { symbol: symbol } })
            if (currency) {
                //Delete Transactions
                await prisma.transaction.deleteMany({
                    where: {
                        currencyId: currency.id
                    }
                })

                //Delete User and accounts
                await deleteUserAndAccount(user1Email);
                await deleteUserAndAccount(user2Email);

                //Delete Currency
                await prisma.currency.delete({
                    where: {
                        symbol: symbol
                    }
                });
            }

            //Create Currency
            currency = await prisma.currency.create({
                data: {
                    symbol: symbol,
                    name: "TEST Currency",
                    country: "EU"
                }
            })
            currency_id = currency.id;

            await createUserAndAccount(user1Email, "pwd", "+32123456999", "user", currency_id);
            const account1 = await getAccountIdByEmailAndCurrencySymbol(user1Email, currency_id);
            user1AccountId = account1.id;

            await createUserAndAccount(user2Email, "pwd", "+32123456888", "user", currency_id);
            const account2 = await getAccountIdByEmailAndCurrencySymbol(user2Email, currency_id);
            user2AccountId = account2.id;
        }
        catch (error) {
            console.log(error.message);
        }
    });

    after(async () => {
        //Get currency if exist
        let currency = await prisma.currency.findUnique({ where: { symbol: symbol } })
        if (currency) {
            //Delete Transactions
            await prisma.transaction.deleteMany({
                where: {
                    currencyId: currency.id
                }
            })

            //Delete User and accounts
            await deleteUserAndAccount(user1Email);
            await deleteUserAndAccount(user2Email);

            //Delete Currency
            await prisma.currency.delete({
                where: {
                    symbol: symbol
                }
            });
        }

    });

    it('Fund Account - User', async () => {
        const payload = {
            "account": 22,
            "amount": fundAmount,
        }
        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Fund Account - No Account', async () => {
        const payload = {
            //"account" : 123456,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Account field mandatory")

    });

    it('Fund Account - No Account', async () => {
        const payload = {
            "account": user1AccountId,
            //"amount" : fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount field mandatory")
    });

    it('Fund Account - Amount not positive', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": -2,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount must be a positive number")
    });

    it('Fund Account - Currency Not found', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/123/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });

    it('Fund Account - Destination Account Not Found', async () => {
        const payload = {
            "account": 123,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Destination account not found");
    });

    it('Refund Account - Currency Mismatch', async () => {

        const currency = await getCurrencyBySymbol(config.testCurrency);

        const payload = {
            "account": user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Accounts must be from the same currency");
    });


    it('Fund Account - Admin', async () => {

        const payload = {
            "account": user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account Balance
        const account = await getAccountIdByEmailAndCurrencySymbol(user1Email, currency_id);
        if (!account) {
            throw new Error("Account not found");
        }
        assert.equal(Number(account.balance), Number(fundAmount), "Account balance");

        //get The currency Balance
        const currency = await prisma.currency.findUnique({ where: { symbol: symbol } });
        if (!currency) {
            throw new Error("Currency not found");
        }
        const balance = Number(currency.balance) + Number(fundAmount)
        assert.equal(balance, 0, "Currency Balance");

        //get The Transaction
        const transaction = await prisma.transaction.findMany({ where: { currencyId: currency_id } })
        assert(transaction.length > 0, "Transaction");

    });

    it('Transfer - Account Missing', async () => {
        const payload = {
            //"account" : user2AccountId,
            "amount": transferAmount,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Account field mandatory");
    });

    it('Transfer - Amount Missing', async () => {
        const payload = {
            "account": user2AccountId,
            //"amount" : transferAmount,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount field mandatory");
    });

    it('Transfer - Amount Must be a positive number', async () => {
        const payload = {
            "account": user2AccountId,
            "amount": -5,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount must be a positive number");
    });

    it('Transfer - Destination account not found', async () => {
        const payload = {
            "account": 123,
            "amount": transferAmount,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Destination account not found");
    });

    it('Transfer - Source account not found', async () => {
        const payload = {
            "account": user2AccountId,
            "amount": transferAmount,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/123/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Source account not found");
    });

    it('Transfer - Account not the same currency', async () => {
        const account = await getAccountIdByEmailAndCurrencySymbol(config.user1Email, config.symbol)

        const payload = {
            "account": account.id,
            "amount": transferAmount,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Accounts must be from the same currency");
    });

    it('Transfer - Insuficient found', async () => {

        const payload = {
            "account": user2AccountId,
            "amount": 1000,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, "Insufficient funds");
    });

    it('Transfer - Admin', async () => {
        const payload = {
            "account": user2AccountId,
            "amount": transferAmount,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        let balance;
        //Get the account1 Balance
        const account1 = await getAccountIdByEmailAndCurrencySymbol(user1Email, currency_id);
        if (!account1) {
            throw new Error("Account1 not found");
        }
        balance = Number(fundAmount) - Number(transferAmount)
        assert.equal(Number(account1.balance), balance, "Account 1 Balance");

        //Get the account1 Balance
        const account2 = await getAccountIdByEmailAndCurrencySymbol(user1Email, currency_id);
        if (!account2) {
            throw new Error("Account2 not found");
        }
        balance = Number(fundAmount) - Number(transferAmount)
        assert.equal(Number(account2.balance), balance, "Account 2 balance");

    });

    it('Transfer - Admin2', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": transferAmount,
            "description": "1234",
        }

        const res = await request(app)
            .post(`/api/account/${user2AccountId}/transferTo`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account1 Balance
        const account1 = await getAccountIdByEmailAndCurrencySymbol(user1Email, currency_id);
        if (!account1) {
            throw new Error("Account1 not found");
        }
        assert.equal(Number(account1.balance), Number(fundAmount), "Account 1 Balance");

        //Get the account1 Balance
        const account2 = await getAccountIdByEmailAndCurrencySymbol(user2Email, currency_id);
        if (!account2) {
            throw new Error("Account2 not found");
        }
        assert.equal(Number(account2.balance), 0, "Account 2 Balance");

    });

    it('Refund Account - User', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Refund Account - No account', async () => {
        const payload = {
            //"account" : user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Account field mandatory");
    });

    it('Refund Account - No amount', async () => {
        const payload = {
            "account": user1AccountId,
            //"amount" : fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount field mandatory");
    });

    it('Refund Account - Amount non positive number', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": -2,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount must be a positive number");
    });

    it('Refund Account - Currency Not found', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/123/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });

    it('Refund Account - Destination account not found', async () => {
        const payload = {
            "account": "123",
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Destination account not found");
    });

    it('Refund Account - Currency Mismatch', async () => {

        const currency = await getCurrencyBySymbol(config.testCurrency);

        const payload = {
            "account": user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Accounts must be from the same currency");
    });


    it('Refund Account - Insufficient funds', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": 1000,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, "Insufficient funds");
    });

    it('Refund Account - Admin', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account Balance
        const account = await getAccountIdByEmailAndCurrencySymbol(user1Email, currency_id);
        if (!account) {
            throw new Error("Account not found");
        }
        assert.equal(account.balance, 0);

        //get The currency Balance
        const currency = await prisma.currency.findUnique({ where: { symbol: symbol } });
        if (!currency) {
            throw new Error("Currency not found");
        }
        assert.equal(Number(currency.balance), 0);

    });

})
