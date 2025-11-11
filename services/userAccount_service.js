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