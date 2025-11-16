import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { getCurrencyBySymbol } from './currency_service.js';
import { getAccountId, AccountType } from '../utils/accountUtil.js';

export const createAccount = async (symbol, accountType) => {
    try {

        const currency = await getCurrencyBySymbol(symbol);
        if (!currency) {
            throw new Error("Currency not found");
        }

        let accountId = currency.accountNextNumber + 1;
        let accountExists = false;
        let accountNumber;
        while (!accountExists) {

            accountNumber = getAccountId(accountType, currency.id, accountId);

            const accountCount = await prisma.account.count({
                where: { number: accountNumber }
            });

            if (accountCount === 0) {
                accountExists = true;
            }
            else {
                accountId += 1;
            }
        }

        // Update Currency Next Number
        await prisma.currency.update({
            where: { id: currency.id },
            data: { accountNextNumber: accountId }
        });

        const account = await prisma.account.create({
            data: {
                number: accountNumber,
                currencyId: currency.id,
                accountType: accountType
            }
        });

        return account;
    }
    catch (error) {
        console.error("Error Create Account Service : " + error.message);
        throw error
    }
}
export const createPersonnalAccount = async (user, symbol) => {
    try {
        const account = await createAccount(symbol, AccountType.PERSONAL);

        // Update Personnal Account Table
        await prisma.personalAccount.create({
            data: {
                userId: user.id,
                accountNumber: account.number
            }
        });

        return account
    }
    catch (error) {
        console.error("Error Create Personal Account Service : " + error.message);
        throw error
    }
}

export const createMerchantAccount = async (merchant, symbol) => {
    try {
        const account = await createAccount(symbol, AccountType.MERCHANT);

        // Update Merchant Account Table
        await prisma.merchantAccount.create({
            data: {
                merchantId: merchant.id,
                accountNumber: account.number
            }
        });

        return account;
    }
    catch (error) {
        console.error("Error Create Merchant Account Service : " + error.message);
        throw error
    }
}

export const createCurrencyMainAccount = async (currency) => {
    try {
        const account = await createAccount(currency.symbol, AccountType.CURRENCY_MAIN);

        //Update currency main account
        await prisma.currency.update({
            where: { id: currency.id },
            data: {
                mainCurrencyAccountNumber: account.number
            }
        });
        return account;
    } catch (error) {
        console.error("Error Create Currency Main Account Service : " + error.message);
        throw error
    }
}

export const getAccounts = async () => {
    const accounts = await prisma.account.findMany();
    return accounts;
};

export const getAccountById = async (accountId) => {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    return account;
};

export const getAccountByNumber = async (accountNumber) => {
    const account = await prisma.account.findUnique({ where: { number: accountNumber } });
    return account;
};

export const getUserAccounts = async (userId) => {
    // Get the personnal account numbers
    const accountIdList = await prisma.personalAccount.findMany({ where: { userId: userId }, select: { accountNumber: true } });
    const accounts = [];

    // Get The list Of accounts for this user
    for (const accountId of accountIdList) {
        const account = await getAccountByNumber(accountId.accountNumber);
        if (account) {
            accounts.push(account);
        }
    }
    return accounts;
};

export const getMerchantAccounts = async (merchantId) => {
    const accountIdList = await prisma.merchantAccount.findMany({ where: { merchantId: merchantId }, select: { accountNumber: true } });
    const accounts = [];
    for (const accountId of accountIdList) {
        const account = await getAccountByNumber(accountId.accountNumber);
        if (account) {
            accounts.push(account);
        }
    }

    return accounts;
};

export const getAccountCountByCurrencyId = async (currencyId) => {
    return await prisma.account.count({
        where: {
            currencyId: currencyId
        }
    });
}

export const getPersonnalAccountCountByCurrencyId = async (currencyId) => {
    return await prisma.account.count({
        where: {
            currencyId: currencyId,
            number :{
                startsWith: String(AccountType.PERSONAL)
            }
        }
    });
}

export const getMerchantAccountCountByCurrencyId = async (currencyId) => {
    return await prisma.account.count({
        where: {
            currencyId: currencyId,
             number :{
                 startsWith: String(AccountType.MERCHANT)
             }
        }
    });
}

export const deleteAccount = async (number) => {
    await prisma.account.delete({
        where: {
            number: number,
        }
    });
}
