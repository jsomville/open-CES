import { prisma } from '../utils/prisma.ts';

import { getCurrencyBySymbol } from './currency_service.ts';
import { getAccountId, AccountType } from '../utils/accountUtil.ts';
import { SortOrder } from '../generated/prisma/internal/prismaNamespace.ts';

export const createAccount = async (symbol: string, accountType: number) => {
    try {

        const currency = await getCurrencyBySymbol(symbol);
        if (!currency) {
            throw new Error("Currency not found");
        }

        let accountId = currency.accountNextNumber + 1;
        let accountExists = false;
        let accountNumber: string = "";

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
    catch (error : any) {
        console.error("Error Create Account Service : " + error.message);
        throw error
    }
}
export const createpersonalAccount = async (user: any, symbol: string) => {
    try {
        const account = await createAccount(symbol, AccountType.PERSONAL);

        // Update personal Account Table
        await prisma.personalAccount.create({
            data: {
                userId: user.id,
                accountNumber: account.number
            }
        });

        return account
    }
    catch (error : any) {
        console.error("Error Create Personal Account Service : " + error.message);
        throw error
    }
}

export const createMerchantAccount = async (merchant: any, symbol: string) => {
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
    catch (error : any) {
        console.error("Error Create Merchant Account Service : " + error.message);
        throw error
    }
}

export const createCurrencyMainAccount = async (currency: any) => {
    try {
        // Create Currency Accounts
        const mainAccount = await createAccount(currency.symbol, AccountType.CURRENCY_MAIN);
        const reconversionAccount = await createAccount(currency.symbol, AccountType.CURRENCY_MAIN);

        //Update currency main account
        await prisma.currency.update({
            where: { id: currency.id },
            data: {
                mainCurrencyAccountNumber: mainAccount.number,
                reconversionAccountNumber: reconversionAccount.number
            }
        });
    } catch (error : any) {
        console.error("Error Create Currency Main Account Service : " + error.message);
        throw error
    }
}

export const getAccounts = async () => {
    const accounts = await prisma.account.findMany({ orderBy: { number: 'desc' } });
    return accounts;
};

export const getAccountById = async (accountId: number) => {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    return account;
};

export const getAccountByNumber = async (accountNumber: string) => {
    const account = await prisma.account.findUnique({ where: { number: accountNumber } });
    return account;
};

export const getUserAccounts = async (userId: number) => {
    // Get the personal account numbers
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

export const getMerchantAccounts = async (merchantId: number) => {
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

export const getAccountCountByCurrencyId = async (currencyId: number) => {
    return await prisma.account.count({
        where: {
            currencyId: currencyId
        }
    });
}

export const getpersonalAccountCountByCurrencyId = async (currencyId: number) => {
    return await prisma.account.count({
        where: {
            currencyId: currencyId,
            number :{
                startsWith: String(AccountType.PERSONAL)
            }
        }
    });
}

export const getMerchantAccountCountByCurrencyId = async (currencyId: number) => {
    return await prisma.account.count({
        where: {
            currencyId: currencyId,
             number :{
                 startsWith: String(AccountType.MERCHANT)
             }
        }
    });
}

export const getActiveAccountCountByCurrencyId = async (currencyId: number) => {
    // Get the number of accounts that had at least one transaction in the last 30 days
  
    return await prisma.account.count({
        where: {
            currencyId: currencyId,
            updatedAt : {
                gte: new Date(new Date().setDate(new Date().getDate() - 360))
            },
            accountType : {
                not: AccountType.CURRENCY_MAIN
            }
        }
    });
}

export const deleteAccount = async (number: string) => {
    await prisma.account.delete({
        where: {
            number: number,
        }
    });
}
