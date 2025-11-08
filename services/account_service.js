import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { getUserByEmail } from './user_service.js';
import { getAccount } from '../controller/accountController.js';

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

export const transferTo = async (sourceAccount, destinationAccount, amount, description) => {
  try {
    const newSourceBalance = (Number(sourceAccount.balance) - Number(amount)).toFixed(2);

    const newDestinationBalance = (Number(destinationAccount.balance) + Number(amount)).toFixed(2);

    await prisma.$transaction([
      //Update Source Account Balance
      prisma.account.update({
        where: { id: sourceAccount.id },
        data: { balance: newSourceBalance },
      }),

      //Update Destination Account Balance
      prisma.account.update({
        where: { id: destinationAccount.id },
        data: { balance: newDestinationBalance },
      }),

      //Create From Transaction
      prisma.transaction.create({
        data: {
          accountId: sourceAccount.id,
          amount: amount,
          currencyId: sourceAccount.currencyId,
          description: description,
          transactionType: "Transfer",
          status: "Completed"
        }
      }),

      //Create From Transaction
      prisma.transaction.create({
        data: {
          accountId: destinationAccount.id,
          amount: amount,
          currencyId: sourceAccount.currencyId,
          description: description,
          transactionType: "Received",
          status: "Completed"
        }
      }),
    ]);
    return true;

  } catch (error) {
    console.error("Error Transfer To Service : " + error.message);
    return false;
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
export function getAccountCountByUserId(userId) {
    return prisma.account.count({
        where: {
            userId: userId
        }
    });
}  
