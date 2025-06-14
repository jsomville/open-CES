import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { getUserByEmail } from '../controller/userController.js';
import { getCurrency } from './currencyController.js';


export const deleteUserAndAccount = async (email) => {
  const user = await getUserByEmail(email);
  if (user) {

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    if (accounts) {

      // Delete all transactions per accounts
      for (const account of accounts) {
        await prisma.transaction.deleteMany({
          where: {
            accountId: account.id
          }
        });
      }
    }

    //Delete User's Account
    await prisma.account.deleteMany({
      where: {
        userId: user.id
      }
    });

    //Delete User
    await prisma.user.delete({
      where: { id: user.id }
    });
  }
}

export const createUserAndAccount = async (email, password, phone, role, currencyId) => {
  const pwdHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: {
      firstname: "user",
      lastname: "test",
      email: email,
      phone: phone,
      region: "EU",
      passwordHash: pwdHash,
      role: role
    }
  });

  if (role == "user") {
    // Create Account
    await prisma.account.create({
      data: {
        userId: user.id,
        currencyId: currencyId,
        accountType: 1, // TO FIX
      }
    })
  }
}

export const getAccountIdByEmailAndCurrencySymbol = async (email, currencyId) => {
  const user = await getUserByEmail(email);
  if (user) {
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        currencyId: currencyId,
      }
    })
    return account;
  }
  return null;
}