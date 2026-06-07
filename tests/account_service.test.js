import assert from "node:assert";

import { prisma } from '../utils/prisma.ts';

import config from "./config.test.js";
import {
    createAccount,
    createPersonalAccount,
    createMerchantAccount,
    createCurrencyMainAccount,
    getAccountById,
    getAccountByNumber,
    getUserAccounts,
    getMerchantAccounts,
    deleteAccount,
    getPersonalAccountCountByCurrencyId,
    getMerchantAccountCountByCurrencyId
} from '../services/account_service.ts';

import { getUserByEmail, createUser, deleteUser } from '../services/user_service.ts';
import { getCurrencyBySymbol } from '../services/currency_service.ts';
import { AccountType } from '../utils/accountUtil.ts';
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

            // Cleanup
            const currency = await getCurrencyBySymbol(config.testCurrencyForAccountSymbol);
            if (currency) {
                if (currency.mainCurrencyAccountNumber) {
                    console.log("Deleting main currency account for cleanup:", currency.mainCurrencyAccountNumber);
                    await deleteAccount(currency.mainCurrencyAccountNumber);
                }
                if (currency.reconversionAccountNumber) {
                    console.log("Deleting reconversion account for cleanup:", currency.reconversionAccountNumber);
                    await deleteAccount(currency.reconversionAccountNumber);
                }   
                await prisma.currency.delete({ where: { symbol: config.testCurrencyForAccountSymbol } });
            }


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
            const passwordHash = await argon2.hash(userInfo.password);
            testUser = await createUser(userInfo.email, userInfo.phone, passwordHash, userInfo.role, userInfo.firstname, userInfo.lastname);

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
        testPersonalAccount = await createPersonalAccount(testUser, testCurrency.symbol);

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
                symbol: config.testCurrencyForAccountSymbol,
                name: "TestServiceMain",
                country: "US"
            }
        });

        await createCurrencyMainAccount(tempCurrency);

        // Check currency was updated
        const updatedCurrency = await getCurrencyBySymbol(config.testCurrencyForAccountSymbol);
        assert.ok(updatedCurrency.mainCurrencyAccountNumber);
        assert.ok(updatedCurrency.reconversionAccountNumber);

        // Cleanup
        await deleteAccount(updatedCurrency.mainCurrencyAccountNumber);
        await deleteAccount(updatedCurrency.reconversionAccountNumber);

        await prisma.currency.delete({ where: { symbol: config.testCurrencyForAccountSymbol } });
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

    it(" get getPersonalAccountCountByCurrencyId", async () => {
        const countBefore = await getPersonalAccountCountByCurrencyId(testCurrency.id);

        const tempAccount = await createAccount(testCurrency.symbol, AccountType.PERSONAL);

        const countAfter = await getPersonalAccountCountByCurrencyId(testCurrency.id);

        assert.equal(countAfter, countBefore + 1);

        // Cleanup
        await deleteAccount(tempAccount.number);
    });

    it(" get getMerchantAccountCountByCurrencyId", async () => {
        const countBefore = await getMerchantAccountCountByCurrencyId(testCurrency.id);

        const tempAccount = await createAccount(testCurrency.symbol, AccountType.MERCHANT);

        const countAfter = await getMerchantAccountCountByCurrencyId(testCurrency.id);

        assert.equal(countAfter, countBefore + 1);

        // Cleanup
        await deleteAccount(tempAccount.number);
    });

});