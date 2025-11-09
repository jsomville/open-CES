import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

export const transferTo = async (sourceAccount, destinationAccount, amount, descriptionFrom, descriptionTo) => {
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
          description: descriptionTo,
          transactionType: "Transfer To",
          status: "Completed"
        }
      }),

      //Create From Transaction
      prisma.transaction.create({
        data: {
          accountId: destinationAccount.id,
          amount: amount,
          currencyId: sourceAccount.currencyId,
          description: descriptionFrom,
          transactionType: "Received From",
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