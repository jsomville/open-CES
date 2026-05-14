import { prisma } from '../utils/prisma.ts';

export const transferFunds = async (type : string, sourceAccount: any, destinationAccount: any, amount: number, descriptionFrom: string, descriptionTo: string) => {
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

  } catch (error : any) {
    console.error("Error Transfer Funds : " + error.message);
    return false;
  }
}

export const doFundAccount = async (currencyAccount : any, toAccount: any, amount: number) => {
    try {
      // What was done
      const transferType : string = "Fund Account"
      const descriptionTo : string = `Fund from account ${currencyAccount.number}`;
      const descriptionFrom : string = `Fund to account ${toAccount.number}`;

      await transferFunds(transferType, currencyAccount, toAccount, amount, descriptionFrom, descriptionTo);
      
    }
    catch (error : unknown) {
        console.error("Error Fund Account Service : " + error);
        throw error;
    }
}

export const doRefundAccount = async (currencyAccount : any, account: any, amount: number) => {
    try {
      // What was done
      const transferType : string = "Refund Account"
      const descriptionTo : string = `Refund from account ${account.number}`;
      const descriptionFrom : string = `Refund to account ${currencyAccount.number}`;
      await transferFunds(transferType, account, currencyAccount, amount, descriptionFrom, descriptionTo);
    }
    catch (error : unknown) {
        console.error("Error Refund Account Service : " + error);
        throw error;
    }
}

