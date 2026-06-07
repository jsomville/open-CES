import assert from "node:assert";
import request from 'supertest';

import { prisma } from '../utils/prisma.ts';

import { app } from "../app.js";
import config from "./config.test.js";
import { getCurrencyBySymbol } from '../services/currency_service.ts';
import { getAccessTokenByEmailAndRole } from "../services/auth_service.ts";
import { createUser } from "../services/user_service.ts";
import { createPersonalAccount, getAccountByNumber, createCurrencyMainAccount} from "../services/account_service.ts";

describe("Test Fund / Refund", () => {
    let admin_access_token;
    let user_access_token;

    const userEmail = "fun_refund@opences.com";

    let currency;
    let currency2;
    let user;
    let account
    const fundAmount = 2.22;

    const currency3Symbol = "TST3";

    before(async () => {

        //Get main Testing Tokens
        user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
        admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

        try {
            currency = await getCurrencyBySymbol(config.testCurrency);

            await prisma.user.deleteMany({ where: { email: userEmail } });

            const userData = {
                firstname: "John",
                lastname: "Doe",
                email: userEmail,
                phone: "+42471041010",
                region: "EU",
                passwordHash: "FAKE",
                role: "user"
            }
            user = await createUser(userData.email, userData.phone, userData.passwordHash, userData.role, userData.firstname, userData.lastname);

            if (!user) {
                throw new Error("FundRefund Test - Before - User not found")
            }

            account = await createPersonalAccount(user, currency.symbol);

            await prisma.account.deleteMany({ where: { Currency: { symbol: currency3Symbol } } });
            await prisma.currency.deleteMany({ where: { symbol: currency3Symbol } });

            currency2 = await prisma.currency.create({
                data: {
                    symbol: currency3Symbol,
                    name: 'TestCurrency3',
                    country: 'US',
                }
            });

            await createCurrencyMainAccount(currency2);
        }
        catch (error) {
            console.log(error.message);
            throw error;
        }
    });

    after(async () => {

        try {
            //delete transactions
            await prisma.transaction.deleteMany({ where: { Currency: { symbol: config.testCurrency } } });

            if (account) {
                await prisma.personalAccount.deleteMany({ where: { accountNumber: account.number } });
            }

            if (account) {
                await prisma.account.deleteMany({ where: { number: account.number } });
            }

            await prisma.user.deleteMany({ where: { email: userEmail } });
            
            await prisma.transaction.deleteMany({ where: { Currency: { symbol: currency3Symbol } } });
            await prisma.account.deleteMany({ where: { Currency: { symbol: currency3Symbol } } });
            await prisma.currency.deleteMany({ where: { symbol: currency3Symbol } });
        }
        catch (error) {
            console.log(error.message);
            throw error;
        }
    });

    it('Fund Account - User', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }
        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Fund Account - No Account', async () => {
        const payload = {
            //number : 123456,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Fund Account - Account as float', async () => {
        const payload = {
            number: 2.5,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Fund Account - Account as string', async () => {
        const payload = {
            number: "abc",
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Fund Account - No Amount', async () => {
        const payload = {
            number: account.number,
            //amount : fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Fund Account - Amount not positive', async () => {
        const payload = {
            number: account.number,
            amount: -2,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Fund Account - Amount as string', async () => {
        const payload = {
            number: account.number,
            amount: "abc",
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Fund Account - Currency Not found', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/999/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });

    it('Fund Account - Destination Account Not Found', async () => {
        const payload = {
            number: "165-9999-99999",
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Destination account not found");
    });

    it('Fund Account - Currency Mismatch', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency2.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Accounts must be from the same currency");
    });


    it('Fund Account - Admin', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account Balance
        const account2 = await getAccountByNumber(account.number);
        if (!account2) {
            throw new Error("Account not found");
        }

        assert.equal(Number(account2.balance), Number(fundAmount), "Account balance");

        //get The currency Balance
        const emissionAccount = await getAccountByNumber(currency.mainCurrencyAccountNumber);
        if (!emissionAccount) {
            throw new Error("Currency emission account not found");
        }

        const reconversionAccount = await getAccountByNumber(currency.reconversionAccountNumber);
        if (!reconversionAccount) {
            throw new Error("Currency reconversion account not found");
        }
        
        const currencyBalance = Number(emissionAccount.balance) - Number(reconversionAccount.balance);

        //const balance = Number(emissionAccount.balance) + Number(fundAmount);
        const balance = currencyBalance + Number(fundAmount);
        assert.equal(balance, 0, "Currency Balance");

        //get The Transaction
        const transaction = await prisma.transaction.findMany({ where: { currencyId: currency.id } })
        assert(transaction.length > 0, "Transaction");

    });

    it('Refund Account - User', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Refund Account - No account', async () => {
        const payload = {
            //number : account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Refund Account - Account as string', async () => {
        const payload = {
            number: "abc",
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Refund Account - Account as float', async () => {
        const payload = {
            number: 4.5,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Refund Account - No amount', async () => {
        const payload = {
            number: account.number,
            //amount : fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Refund Account - Amount as string', async () => {
        const payload = {
            number: account.number,
            amount: "abc",
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Refund Account - Amount non positive number', async () => {
        const payload = {
            number: account.number,
            amount: -2,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Refund Account - Currency Not found', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/999/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Currency not found");
    });

    it('Refund Account - Destination account not found', async () => {
        const payload = {
            number: "199-0009-00009",
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "Source account not found");
    });

    it('Refund Account - Currency Mismatch', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency2.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Accounts must be from the same currency");
    });


    it('Refund Account - Insufficient funds', async () => {
        const payload = {
            number: account.number,
            amount: 1000000,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, "Insufficient funds");
    });

    it('Refund Account - Admin', async () => {
        const payload = {
            number: account.number,
            amount: fundAmount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency.id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //get The account Balance
        const account2 = await getAccountByNumber(account.number);
        if (!account2) {
            throw new Error("Account not found");
        }
        assert.equal(Number(account2.balance), 0, "Account balance");

        //Get the currency account Balance
        const reconversionAccount = await getAccountByNumber(currency.reconversionAccountNumber);
        if (!reconversionAccount) {
            throw new Error("Currency account not found");
        }
        assert.equal(reconversionAccount.balance, fundAmount, "Currency account balance");

        //get The currency Balance
        const emissionAccount = await getAccountByNumber(currency.mainCurrencyAccountNumber);
        if (!emissionAccount) {
            throw new Error("Currency emission account not found");
        }

        const currencyBalance = Number(emissionAccount.balance) + Number(reconversionAccount.balance);
        assert.equal(currencyBalance, 0, "Currency Balance");

    });

})
