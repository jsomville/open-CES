import assert from "node:assert";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import config from "./config.test.js";
import {
    createAccount,
    createPersonnalAccount,
    createMerchantAccount,
    createCurrencyMainAccount,
    getAccountById,
    getAccountByNumber,
    getUserAccounts,
    getMerchantAccounts,
    deleteAccount
} from '../services/account_service.js';

import { getUserByEmail, createUser, deleteUser } from '../services/user_service.js';
import { getCurrencyBySymbol } from '../services/currency_service.js';
import { AccountType } from '../utils/accountUtil.js';
import argon2 from 'argon2';

describe("Account Service Tests", () => {
    let testUser;
    let testCurrency;
    let testPersonalAccount;
    let testMerchantAccount
    let testMerchant;

    const testUserEmail = "account_service_test@test.com";

    before(async () => {
        try {
            testUser = await getUserByEmail(testUserEmail);
            if (testUser) {
                await deleteUser(testUser.id);
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

            // Get test currency
            testCurrency = await getCurrencyBySymbol(config.testCurrency);

            // Create test merchant
            testMerchant = await prisma.merchant.create({
                data: {
                    name: "Test Merchant",
                    email: "merchant@test.com",
                    region: "US"
                }
            });
        } catch (error) {
            console.error("Setup error:", error);
            throw error;
        }
    });

    after(async () => {
        try {
            // Cleanup
            if (testPersonalAccount) {
                await prisma.personalAccount.deleteMany({ where: { accountNumber: testPersonalAccount.number } });
                await deleteAccount(testPersonalAccount.number);
            }

            if (testMerchantAccount) {
                await prisma.merchantAccount.deleteMany({ where: { accountNumber: testMerchantAccount.number } });
                await deleteAccount(testMerchantAccount.number);
            }

            await prisma.merchant.delete({ where: { id: testMerchant.id } });

            await deleteUser(testUser.id);
        } catch (error) {
            console.error("Cleanup error:", error);
        }
    });


    it("should create an account with valid data", async () => {
        const account = await createAccount(testCurrency.symbol, AccountType.PERSONAL);

        assert.ok(account);
        assert.equal(account.currencyId, testCurrency.id);
        assert.equal(account.accountType, AccountType.PERSONAL);

        // Cleanup
        await deleteAccount(account.number);
    });


    it("should create a personal account for a user", async () => {
        testPersonalAccount = await createPersonnalAccount(testUser, testCurrency.symbol);

        assert.ok(testPersonalAccount);
        assert.equal(testPersonalAccount.currencyId, testCurrency.id);
        assert.equal(testPersonalAccount.accountType, AccountType.PERSONAL);

        // Check personal account link
        const personalAccount = await prisma.personalAccount.findFirst({
            where: { userId: testUser.id, accountNumber: testPersonalAccount.number }
        });
        assert.ok(personalAccount);
    });


    it("should create a merchant account", async () => {
        testMerchantAccount = await createMerchantAccount(testMerchant, testCurrency.symbol);

        assert.ok(testMerchantAccount);
        assert.equal(testMerchantAccount.currencyId, testCurrency.id);
        assert.equal(testMerchantAccount.accountType, AccountType.MERCHANT);

        // Check merchant account link
        const merchantAccountLink = await prisma.merchantAccount.findFirst({
            where: { merchantId: testMerchant.id, accountNumber: testMerchantAccount.number }
        });
        assert.ok(merchantAccountLink);
    });


    it("should create a currency main account", async () => {
        // Create a test currency
        const tempCurrency = await prisma.currency.create({
            data: {
                symbol: "TSM",
                name: "TestServiceMain",
                country: "US"
            }
        });

        const mainAccount = await createCurrencyMainAccount(tempCurrency);

        assert.ok(mainAccount);
        assert.equal(mainAccount.accountType, AccountType.CURRENCY_MAIN);

        // Check currency was updated
        const updatedCurrency = await getCurrencyBySymbol("TSM");
        assert.equal(updatedCurrency.mainCurrencyAccountNumber, mainAccount.number);

        // Cleanup
        await deleteAccount(mainAccount.number);
        await prisma.currency.delete({ where: { id: tempCurrency.id } });
    });


    it("should retrieve an account by ID", async () => {
        const account = await getAccountById(testPersonalAccount.id);

        assert.ok(account);
        assert.equal(account.id, testPersonalAccount.id);
        assert.equal(account.number, testPersonalAccount.number);
    });

    it("should return null for non-existent ID", async () => {
        const account = await getAccountById(999999);
        assert.equal(account, null);
    });



    it("should retrieve an account by number", async () => {
        const account = await getAccountByNumber(testPersonalAccount.number);

        assert.ok(account);
        assert.equal(account.number, testPersonalAccount.number);
    });

    it("should return null for non-existent number", async () => {
        const account = await getAccountByNumber("FAKE-999");
        assert.equal(account, null);
    });




    it("should retrieve all accounts for a user", async () => {
        const accounts = await getUserAccounts(testUser.id);

        assert.ok(Array.isArray(accounts));
        assert.ok(accounts.length > 0);
    });


    it("should retrieve all merchant accounts", async () => {
        const accounts = await getMerchantAccounts(testMerchant.id);

        assert.ok(Array.isArray(accounts));
        assert.ok(accounts.length > 0);
    });





    it("should delete an account", async () => {
        const tempAccount = await createAccount(testCurrency.symbol, AccountType.PERSONAL);

        await deleteAccount(tempAccount.number);

        const deletedAccount = await getAccountByNumber(tempAccount.number);
        assert.equal(deletedAccount, null);
    });

});