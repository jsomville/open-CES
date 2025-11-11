import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

/*export const doFundAccount = async (currency, account, amount) => {
    try {
        const newAccountBalance = Number(account.balance) + Number(amount);
        const newCurrencyBalance = Number(currency.balance) - Number(amount);

        await prisma.$transaction([

            //Update Currency Balance
            prisma.currency.update({
                where: { id: currency.id },
                data: { balance: newCurrencyBalance }
            }),

            //Update Account Balance
            prisma.account.update({
                where: { id: account.id },
                data: { balance: newAccountBalance },
            }),

            //Create Transaction
            prisma.transaction.create({
                data: {
                    accountId: account.id,
                    amount: amount,
                    currencyId: currency.id,
                    transactionType: "Fund Account",
                    description: `To account # ${account.id}`,
                    status: "Completed"
                }
            }),
        ])
    }
    catch (error) {
        console.error("Error Fund Account Service : " + error.message);
        throw error;
    }
}

export const doRefundAccount = async (currency, account, amount) => {
    try {
        const newCurrencyBalance = Number(currency.balance) + Number(amount);
        const newAccountBalance = Number(account.balance) - Number(amount);

        await prisma.$transaction([
            //Update Currency Balance
            prisma.currency.update({
                where: { id: currency.id },
                data: { balance: newCurrencyBalance }
            }),

            //Update Account Balance
            prisma.account.update({
                where: { id: account.id },
                data: { balance: newAccountBalance },
            }),

            //Create a Transaction
            prisma.transaction.create({
                data: {
                    accountId: account.id,
                    amount: amount,
                    currencyId: currency.id,
                    transactionType: "Refund Account",
                    description: `From account # ${account.id}`,
                    status: "Completed"
                }
            }),
        ]);
    }
    catch (error) {
        console.error("Error Refund Account Service : " + error.message);
        throw error;
    }
}*/

