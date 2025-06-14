import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

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

export const getUserAccounts = async (userId) => {
    const accounts = await prisma.account.findMany({ where: { userId: userId } });
    return accounts;
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

export const getAccountByEmailAndCurrency = async (email, currencyId) => {
    const user = await getUserByEmail(email);
    if (user) {
        const account = await prisma.account.findFirst({ where: { userId: user.id, currencyId: currencyId } });
        return account;
    }
    return null;
}