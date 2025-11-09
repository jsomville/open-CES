import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { getUserByEmail } from './user_service.js';
import { getCurrencyBySymbol } from './currency_service.js';
import { AccountType, isValidAccountType } from '../utils/accountTypes.js'; 

export const createAccount = async (userId, currencyId, accountType) => {
  try {
    const newAccount = await prisma.account.create({
      data: {
        userId: userId,
        currencyId: currencyId,
        accountType: accountType
      }
    });
    return newAccount;
  } catch (error) {
    console.error("Error Create Account Service : " + error.message);
    return null;
  }
}

export const getAccountByEmailAndCurrencyId = async (email, currencyId) => {
  const user = await getUserByEmail(email);
  if (user) {
    const account = await getAccountByUserIDAndCurrencyId(user.id, currencyId);
    return account;
  }
  return null;
}

export const getAccountByEmailAndCurrencySymbol = async (email, currencySymbol) => {
  const user = await getUserByEmail(email);
  if (user) {
    const currency = await getCurrencyBySymbol(currencySymbol);
    if (currency) {
      const account = await getAccountByUserIDAndCurrencyId(user.id, currency.id);
      return account;
    }
  }
  return null;
}

export const getUserAccountsByEmail = async (email) => {
  const user = await getUserByEmail(email);
  if (user) {
    const accounts = await getUserAccounts(user.id);
    return accounts;
  }
  return null;
};

export const getAccountById = async (accountId) => {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  return account;
};

export const getUserAccounts = async (userId) => {
  const accounts = await prisma.account.findMany({ where: { userId: userId } });
  return accounts;
};

export const getMerchantAccounts = async (merchantId) => {
  const accounts = await prisma.account.findMany({ where: { merchantId: merchantId } });
  return accounts;
};

export const getAccountByUserIDAndCurrencyId = async (userId, currencyId) => {
  const account = await prisma.account.findFirst({ where: { userId: userId, currencyId: currencyId } });
  return account;
}

export function getAccountCountByCurrencyId(currencyId) {
    return prisma.account.count({
        where: {
            currencyId: currencyId
        }
    });
}

export function getMerchantAccountCountByCurrencyId(currencyId) {
    return prisma.account.count({
        where: {
            currencyId: currencyId,
            merchantId: {
                not: null
            }
        }
    });
}

export function getAccountCountByUserId(userId) {
    return prisma.account.count({
        where: {
            userId: userId
        }
    });
}

export function getTransactionByAccountId(accountId) {
    return prisma.transaction.findMany({
        where: {
            accountId: accountId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export function getLatestTransactionByAccountId(accountId, transactionCount) {
    return prisma.transaction.findMany({
        where: {
            accountId: accountId
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: transactionCount
    });
}

export function getTransactionByAccountIdAndPage(accountId, skip, limit) {
    return prisma.transaction.findMany({
        where: {
            accountId: accountId
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip: skip,
        take: limit
    });
}
