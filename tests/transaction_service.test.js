import assert from "node:assert";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import config from "./config.test.js";

import { getLatestTransactionByAccountNumber, getTransactionByAccountNumber } from '../services/transaction_service.js';

import { getUserByEmail, createUser, deleteUser } from '../services/user_service.js';
import { getCurrencyBySymbol } from '../services/currency_service.js';
import { createPersonnalAccount, deleteAccount } from '../services/account_service.js';


describe("Transaction Service Tests", () => {
    let user;
    let currency;
    let account;

    const userEmail = "transaction_service_test@test.com";

    before(async () => {
        try {
            user = await getUserByEmail(userEmail);
            if (user) {
                await deleteUser(user.id);
            }

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

            // Get test currency
            currency = await getCurrencyBySymbol(config.testCurrency);

            account = await createPersonnalAccount(user, currency.symbol);
            if (!account) {
                throw new Error("Failed to create personal account for test user");
            }
        }
        catch (error) {
            console.error("Setup Error: " + error.message);
        }
    });

    after(async () => {
        try {
            // Cleanup
            if (account) {
                await prisma.personalAccount.deleteMany({ where: { accountNumber: account.number } });
                await deleteAccount(account.number);
            }

            await deleteUser(user.id);
        } catch (error) {
            console.error("Cleanup Error: " + error.message);
        }
    });


    it("should retrieve transactions for an account", async () => {
        const transactions = await getTransactionByAccountNumber(account.number);

        assert.ok(Array.isArray(transactions));
    });



    it("should retrieve latest N transactions", async () => {
        const transactions = await getLatestTransactionByAccountNumber(account.number, 5);

        assert.ok(Array.isArray(transactions));
        assert.ok(transactions.length <= 5);
    });



    it("should retrieve paginated transactions", async () => {
        const transactions = await getLatestTransactionByAccountNumber(account.number, 0, 10);

        assert.ok(Array.isArray(transactions));
        assert.ok(transactions.length <= 10);
    });

});
