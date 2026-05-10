/*import { prisma } from '../utils/prisma.ts';

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
  return accounts;
}*/