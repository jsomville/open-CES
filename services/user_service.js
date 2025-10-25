import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

export const addUser = async (email, phone, password, role = "user", firstname = "john", lastname = "doe", region = "EU") => {
  //Hash the password
  const hashedPassword = await argon2.hash(password);

  //Create User
  const user = await prisma.user.create({
    data: {
      email: email,
      firstname: firstname,
      lastname: lastname,
      phone: phone,
      region: region,
      passwordHash: hashedPassword,
      role: role,
    }
  })

  // Remove password hash
  const { passwordHash, ...safeUser } = user;

  return safeUser;
}

export const removeUser = async (id) => {
  await prisma.user.delete({
    where: { id: id }
  });
}

export const getUserAccountsAndTransactions = async (userId, transactionsCount) => {
  const accounts = await prisma.account.findMany({ where: { userId: userId } });
  for (const account of accounts) {
    const latestTransactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: transactionsCount,
    });
    if (latestTransactions) {
      account.latestTransactions = latestTransactions;
    }
  }
}

/*export const getUserAccounts = async (userId) => {
  const accounts = await prisma.account.findMany({ where: { userId: userId } });
  return accounts;
};*/

/*export const getUserAccountsByEmail = async (email) => {
  const user = await getUserByEmail(email);
  if (user) {
    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    return accounts;
  }
  return null;
};*/

export const getLoginUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {
    return user;
  }
  return null;
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id: id } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const getUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const getUserByPhone = async (phone) => {
  const user = await prisma.user.findUnique({ where: { phone: phone } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const setUserIsActiveByEmail = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {

    const updatedUser = await prisma.user.update({
      data: {
        isActive: true
      },
      where: { email: email }
    });
    // Remove password hash
    const { passwordHash, ...safeUser } = updatedUser;

    return safeUser
  }
  return null;
}

export const setActiveUser = async (userId) => {
  await prisma.user.update({
    data: {
      isActive: true
    },
    where: { id: userId }
  });
}

export const setPhoneValidated = async (userId) => {
  await prisma.user.update({
    data: {
      isPhoneValidated: true
    },
    where: { id: userId }
  });
}

export const setEmailValidated = async (userId) => {
  await prisma.user.update({
    data: {
      isEmailValidated: true
    },
    where: { id: userId }
  });
}

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