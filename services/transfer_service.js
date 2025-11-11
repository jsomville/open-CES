import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

export const transferFunds = async (type, sourceAccount, destinationAccount, amount, descriptionFrom, descriptionTo) => {
  try {
    const newSourceBalance = (Number(sourceAccount.balance) - Number(amount)).toFixed(2);
    const newDestinationBalance = (Number(destinationAccount.balance) + Number(amount)).toFixed(2);

    await prisma.$transaction([
      //Update Source Account Balance
      prisma.account.update({
        where: { number: sourceAccount.number },
        data: { balance: newSourceBalance },
      }),

      //Update Destination Account Balance
      prisma.account.update({
        where: { number: destinationAccount.number },
        data: { balance: newDestinationBalance },
      }),

      //Create From Transaction
      prisma.transaction.create({
        data: {
          accountNumber: sourceAccount.number,
          amount: (amount * -1),
          currencyId: sourceAccount.currencyId,
          description: descriptionTo,
          transactionType: type,
          status: "Completed"
        }
      }),

      //Create From Transaction
      prisma.transaction.create({
        data: {
          accountNumber: destinationAccount.number,
          amount: amount,
          currencyId: sourceAccount.currencyId,
          description: descriptionFrom,
          transactionType: type,
          status: "Completed"
        }
      }),
    ]);
    return true;

  } catch (error) {
    console.error("Error Transfer Funds : " + error.message);
    return false;
  }
}