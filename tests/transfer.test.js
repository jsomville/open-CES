import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { app } from "../app.js";
import config from "./config.test.js";
import { getAccountByEmailAndCurrencyId, createUserAndAccount, deleteUserAndAccount } from "../services/user_service.js";
import { getAccessTokenByEmailAndRole, getAccessToken } from "../services/auth_service.js";


describe("Test Transfer", () => {
    let admin_access_token;
    let user_access_token;
    let user1Token;
    let user2Token;

    let currency_id;
    const symbol1 = "ABC";
    const user1Email = "user1@ABC.com";
    const user2Email = "user2@ABC.com";
    const symbol2 = "ABC";
    const user3Email = "user3@XYZ.com";
    let user1AccountId;
    let user2AccountId;
    const fundAmount = 2.24;
    const transferAmount = 1.11;


    before(async () => {
        try {
            //Get main Testing Tokens
            user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
            admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

            //Get currency if exist
            let currency = await prisma.currency.findUnique({ where: { symbol: symbol1 } })
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
                await deleteUserAndAccount(user3Email);

                //Delete Currency
                await prisma.currency.delete({
                    where: {
                        symbol: symbol1
                    }
                });
            }

            //Create Currency
            currency = await prisma.currency.create({
                data: {
                    symbol: symbol1,
                    name: "TEST Currency",
                    country: "EU"
                }
            })
            currency_id = currency.id;

            await createUserAndAccount(user1Email, "pwd", "+32123456999", "user", currency_id);
            const account1 = await getAccountByEmailAndCurrencyId(user1Email, currency_id);
            user1AccountId = account1.id;

            //Fund account
            await prisma.account.update({
                where: { id: user1AccountId },
                data: { balance: fundAmount },
            });

            await createUserAndAccount(user2Email, "pwd", "+32123456888", "user", currency_id);
            const account2 = await getAccountByEmailAndCurrencyId(user2Email, currency_id);
            user2AccountId = account2.id;

            /*await createUserAndAccount(user3Email, "pwd", "+32123456888", "user", currency_id);
            const account3 = await getAccountByEmailAndCurrencyId(user3Email, currency_id);
            user2AccountId = account2.id;*/

            const param1 = {
                "email": user1Email,
                "role": "user"
            }
            user1Token = getAccessToken(param1);

            const param2 = {
                "email": user2Email,
                "role": "user"
            }
            user2Token = getAccessToken(param2);
        }
        catch (error) {
            console.log(error.message);
        }
    });

    after(async () => {
        //Get currency if exist
        let currency = await prisma.currency.findUnique({ where: { symbol: symbol1 } })
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
                    symbol: symbol1
                }
            });
        }

    });

    it('Transfer - Account Missing', async () => {
        const payload = {
            //"account" : user2AccountId,
            "amount": transferAmount,
            "description": "Account Missing",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Account field mandatory");
    });

    it('Transfer - Amount Missing', async () => {
        const payload = {
            "account": user2AccountId,
            //"amount" : transferAmount,
            "description": "Amount Missing",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount must be a positive number");
    });

    it('Transfer - Amount Must be a positive number', async () => {
        const payload = {
            "account": user2AccountId,
            "amount": -5,
            "description": "Negative Amount",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Amount must be a positive number");
    });

    it('Transfer - Destination account not found', async () => {
        const payload = {
            "account": 123,
            "amount": transferAmount,
            "description": "Account not found",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Destination account not found");
    });

    it('Transfer - Source account not found', async () => {
        const payload = {
            "account": user2AccountId,
            "amount": transferAmount,
            "description": "Account not found",
        }

        const res = await request(app)
            .post(`/api/account/123/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Source account not found");
    });

    it('Transfer - Account not the same currency', async () => {
        const account = await getAccountByEmailAndCurrencyId(config.user1Email, config.symbol)

        const payload = {
            "account": account.id,
            "amount": transferAmount,
            "description": "Not same currency",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Accounts must be from the same currency");
    });

    it('Transfer - Insuficient found', async () => {
        const payload = {
            "account": user2AccountId,
            "amount": 1000,
            "description": "Insuficient fund",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, "Insufficient funds");
    });

    it('Transfer - Self', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": 1,
            "description": "Transfer to self",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Cannot transfert to same account");
    });

    it('Transfer - Not own account', async () => {
        const payload = {
            "account": user1AccountId,
            "amount": 10,
            "description": "Transfer to self",
        }

        const res = await request(app)
            .post(`/api/account/${user2AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Account must be owned by current user");
    });

    it('Transfer', async () => {
        const account1Temp = await getAccountByEmailAndCurrencyId(user1Email, currency_id);
        const account1Balance = account1Temp.balance;

        const account2Temp = await getAccountByEmailAndCurrencyId(user2Email, currency_id);
        const account2Balance = account2Temp.balance;

        const payload = {
            "account": user2AccountId,
            "amount": transferAmount,
            "description": "Transfer OK",
        }

        const res = await request(app)
            .post(`/api/account/${user1AccountId}/transferTo`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account1 Balance
        const account1 = await getAccountByEmailAndCurrencyId(user1Email, currency_id);
        if (!account1) {
            throw new Error("Account1 not found");
        }
        const balance1 = (Number(account1Balance) - Number(transferAmount)).toFixed(2);
        assert.equal(account1.balance, balance1, "Account 1 Balance");

        //Get the account1 Balance
        const account2 = await getAccountByEmailAndCurrencyId(user2Email, currency_id);
        if (!account2) {
            throw new Error("Account2 not found");
        }
        const balance2 = (Number(account2Balance) + Number(transferAmount)).toFixed(2);
        assert.equal(account2.balance, balance2, "Account 2 balance");
    });
})
