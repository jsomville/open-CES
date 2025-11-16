import assert from "node:assert";
import { v4 as uuidv4 } from 'uuid';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import config from "./config.test.js";
import { getCurrencyBySymbol } from "../services/currency_service.js";
import { daysFromNow } from "../controller/voucherController.js";
import { 
    VoucherStatus, 
    getVouchers, 
    createVoucher, 
    updateVoucher, 
    getVoucherById, 
    getVoucherByCode, 
    claimVoucherService 
} from "../services/voucher_service.js";
import { getUserByEmail, createUser, deleteUser } from "../services/user_service.js";
import { createPersonnalAccount, getAccountByNumber } from "../services/account_service.js";

describe("Voucher Service Tests", () => {
    let currency;
    let testUser;
    let testAccount;
    let testVoucher;

    const testUserEmail = "voucher_service_test@test.com";

    before(async () => {
        try {
            // Get test currency
            currency = await getCurrencyBySymbol(config.testCurrency);
            if (!currency) {
                throw new Error("Test currency not found");
            }

            // Clean up existing test user
            const existingUser = await getUserByEmail(testUserEmail);
            if (existingUser) {
                // Clean up accounts
                const accounts = await prisma.account.findMany({
                    where: { 
                        PersonalAccount: { userId: existingUser.id }
                    }
                });
                for (const account of accounts) {
                    await prisma.transaction.deleteMany({ where: { accountNumber: account.number } });
                    await prisma.personalAccount.deleteMany({ where: { accountNumber: account.number } });
                    await prisma.account.delete({ where: { number: account.number } });
                }
                await deleteUser(existingUser.id);
            }

            // Create test user
            testUser = await createUser(
                testUserEmail,
                "+1234567890",
                "FAKE_HASH",
                "user",
                "Voucher",
                "Service"
            );

            // Create test account
            testAccount = await createPersonnalAccount(testUser, currency.symbol);

            // Clean up existing test vouchers
            await prisma.voucher.deleteMany({
                where: {
                    currencyId: currency.id,
                }
            });

        } catch (error) {
            console.error("Setup Error: " + error.message);
            throw error;
        }
    });

    after(async () => {
        try {
            // Clean up test vouchers
            await prisma.voucher.deleteMany({
                where: {
                    currencyId: currency.id,
                }
            });

            // Clean up test account
            if (testAccount) {
                await prisma.transaction.deleteMany({ where: { accountNumber: testAccount.number } });
                await prisma.personalAccount.deleteMany({ where: { accountNumber: testAccount.number } });
                await prisma.account.delete({ where: { number: testAccount.number } });
            }

            // Clean up test user
            if (testUser) {
                await deleteUser(testUser.id);
            }
        } catch (error) {
            console.error("Cleanup Error: " + error.message);
        }
    });

    it("should create a voucher with valid data", async () => {
        const code = uuidv4();
        const amount = 10.50;
        const expirationDate = daysFromNow(5)

        const voucher = await createVoucher(code, amount, currency.id, expirationDate);

        assert.ok(voucher);
        assert.ok(voucher.id);
        assert.equal(voucher.code, code);
        assert.equal(voucher.amount, amount);
        assert.equal(voucher.currencyId, currency.id);
        assert.equal(voucher.status, VoucherStatus.ISSUED);
        assert.ok(voucher.expiration);
        assert.ok(voucher.createdAt);

        // Save for later tests
        testVoucher = voucher;
    });

    it("should retrieve all vouchers", async () => {
        const vouchers = await getVouchers();

        assert.ok(Array.isArray(vouchers));
        assert.ok(vouchers.length > 0);
        
        // Check that our test voucher is in the list
        const foundVoucher = vouchers.find(v => v.code === testVoucher.code);
        assert.ok(foundVoucher);
    });

    it("should retrieve a voucher by ID", async () => {
        const voucher = await getVoucherById(testVoucher.id);

        assert.ok(voucher);
        assert.equal(voucher.id, testVoucher.id);
        assert.equal(voucher.code, testVoucher.code);
        assert.equal(voucher.amount, Number(testVoucher.amount));
        assert.equal(voucher.currencyId, currency.id);
    });

    it("should return null for non-existent voucher ID", async () => {
        const voucher = await getVoucherById(999999999);

        assert.equal(voucher, null);
    });

    it("should retrieve a voucher by code", async () => {
        const voucher = await getVoucherByCode(testVoucher.code);

        assert.ok(voucher);
        assert.equal(voucher.code, testVoucher.code);
        assert.equal(voucher.id, testVoucher.id);
        assert.equal(voucher.amount, Number(testVoucher.amount));
        assert.equal(voucher.currencyId, currency.id);
    });

    it("should return null for non-existent voucher code", async () => {
        const voucher = await getVoucherByCode("NON-EXISTENT-CODE");

        assert.equal(voucher, null);
    });

    it("should update voucher expiration date", async () => {
        const newExpiration = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

        const updatedVoucher = await updateVoucher(testVoucher.id, newExpiration);

        assert.ok(updatedVoucher);
        assert.equal(updatedVoucher.id, testVoucher.id);
        assert.equal(updatedVoucher.code, testVoucher.code);
        assert.equal(new Date(updatedVoucher.expiration).getTime(), newExpiration.getTime());
    });

    it("should claim a voucher and update account balance", async () => {
        // Create a new voucher for claiming
        const claimCode = uuidv4();
        const claimAmount = 5.75;
        const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const voucherToClaim = await createVoucher(claimCode, claimAmount, currency.id, expirationDate);

        // Get account balance before claim
        const accountBefore = await getAccountByNumber(testAccount.number);
        const balanceBefore = Number(accountBefore.balance);

        // Claim the voucher
        await claimVoucherService(voucherToClaim, accountBefore);

        // Check voucher status
        const voucherAfter = await getVoucherByCode(claimCode);
        assert.equal(voucherAfter.status, VoucherStatus.REDEEMED);

        // Check account balance
        const accountAfter = await getAccountByNumber(testAccount.number);
        const balanceAfter = Number(accountAfter.balance);
        const expectedBalance = balanceBefore + claimAmount;

        assert.equal(balanceAfter, expectedBalance);

        // Check transaction was created
        const transactions = await prisma.transaction.findMany({
            where: {
                accountNumber: testAccount.number,
                transactionType: "Claim Voucher"
            }
        });

        assert.ok(transactions.length > 0);
        const claimTransaction = transactions.find(t => t.description.includes(voucherToClaim.id.toString()));
        assert.ok(claimTransaction);
        assert.equal(claimTransaction.amount, claimAmount);
        assert.equal(claimTransaction.status, "Completed");
    });

    it("should handle multiple voucher creations", async () => {
        const vouchers = [];
        const voucherCount = 3;
        
        for (let i = 0; i < voucherCount; i++) {
            const code = uuidv4();
            const amount = (i + 1) * 2.5;
            const expirationDate = daysFromNow(i + 10);
            const voucher = await createVoucher(code, amount, currency.id, expirationDate);
            vouchers.push(voucher);
        }

        assert.equal(vouchers.length, voucherCount);

        // Verify all vouchers were created
        for (const voucher of vouchers) {
            const found = await getVoucherByCode(voucher.code);
            assert.ok(found);
            assert.equal(found.code, voucher.code);
        }
    });

    it("should verify VoucherStatus enum values", () => {
        assert.equal(VoucherStatus.ISSUED, 'ISSUED');
        assert.equal(VoucherStatus.REDEEMED, 'REDEEMED');
        assert.equal(VoucherStatus.EXPIRED, 'EXPIRED');
    });

    it("should create vouchers with different amounts", async () => {
        const amounts = [1.00, 5.50, 10.00, 25.75, 100.00];

        for (const amount of amounts) {
            const code = uuidv4();
            const expirationDate = daysFromNow(30);

            const voucher = await createVoucher(code, amount, currency.id, expirationDate);

            assert.ok(voucher);
            assert.equal(voucher.amount, amount);
        }
    });

    it("should create vouchers with different expiration dates", async () => {
        const durations = [7, 30, 90, 180, 365]; // days

        for (const days of durations) {
            const code = uuidv4();
            const amount = 10.00;
            const expirationDate = daysFromNow(days);
            const voucher = await createVoucher(code, amount, currency.id, expirationDate);

            assert.ok(voucher);
            const voucherExpiration = new Date(voucher.expiration).getTime();
            const expectedExpiration = expirationDate.getTime();
            
            // Allow small time difference due to processing time
            assert.ok(Math.abs(voucherExpiration - expectedExpiration) < 1000);
        }
    });
});
