import assert from "node:assert";

import { AccountType, getAccountId, isValidAccountId } from '../utils/accountUtil.js';
import { randomInt } from 'crypto';

describe("Test Account Util", () => {

    it('Generate valid Account ID', async () => {

        const currencyNumber = randomInt(1, 9999);
        const accountNumber = randomInt(1, 99999);

        const accountId = getAccountId(AccountType.PERSONAL, currencyNumber, accountNumber);

        const isValue = isValidAccountId(accountId);

        assert.equal(isValue, true);
    });

    it('Check same parity for same currency number', async () => {

        const currencyNumber = randomInt(1, 9999);

        const accountNumber1 = randomInt(1, 99999);
        const accountId1 = getAccountId(AccountType.PERSONAL, currencyNumber, accountNumber1);

        const accountNumber2 = randomInt(1, 99999);
        const accountId2 = getAccountId(AccountType.PERSONAL, currencyNumber, accountNumber2);

        const isValue1 = isValidAccountId(accountId1);
        const isValue2 = isValidAccountId(accountId2);

        assert.equal(isValue1, true);
        assert.equal(isValue2, true);

        const mod1 = parseInt(accountId1.charAt(1), 10);
        const mod2 = parseInt(accountId2.charAt(1), 10);

        assert.equal(mod1, mod2);
    });

    it('Check same parity for same account number', async () => {

        const currencyNumber1 = randomInt(1, 9999);
        const currencyNumber2 = randomInt(1, 9999);

        const accountNumber = randomInt(1, 99999);
        
        const accountId1 = getAccountId(AccountType.PERSONAL, currencyNumber1, accountNumber);

        const accountId2 = getAccountId(AccountType.PERSONAL, currencyNumber2, accountNumber);

        const isValue1 = isValidAccountId(accountId1);
        const isValue2 = isValidAccountId(accountId2);

        assert.equal(isValue1, true);
        assert.equal(isValue2, true);

        const mod1 = parseInt(accountId1.charAt(2), 10);
        const mod2 = parseInt(accountId2.charAt(2), 10);

        assert.equal(mod1, mod2);
    });

    it('Check same first digit for same account type', async () => {

        const currencyNumber = randomInt(1, 9999);
        const accountNumber = randomInt(1, 99999);

        const accountId = getAccountId(AccountType.PERSONAL, currencyNumber, accountNumber);
        const isValue = isValidAccountId(accountId);

        assert.equal(isValue, true);

        const modAccountType = parseInt(accountId.charAt(0), 10);

        assert.equal(AccountType.PERSONAL, modAccountType);
    });

    it('Check different account types', async () => {

        const currencyNumber = randomInt(1, 9999);
        const accountNumber = randomInt(1, 99999);

        const accountId1 = getAccountId(AccountType.PERSONAL, currencyNumber, accountNumber);
        const isValue1 = isValidAccountId(accountId1);

        assert.equal(isValue1, true);

        const accountId2 = getAccountId(AccountType.MERCHANT, currencyNumber, accountNumber);
        const isValue2 = isValidAccountId(accountId2);

        assert.equal(isValue1, true);
        assert.equal(isValue2, true);

        const modAccountType1 = parseInt(accountId1.charAt(0), 10);
        const modAccountType2 = parseInt(accountId2.charAt(0), 10);

        assert.equal(AccountType.PERSONAL, modAccountType1);
        assert.equal(AccountType.MERCHANT, modAccountType2);
    });
});