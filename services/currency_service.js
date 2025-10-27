import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import redisHelper from '../utils/redisHelper.js';

const cache_ttl = 60; //in seconds

export const getCurrencyBySymbol = async (symbol) => {
    const currency = await prisma.currency.findUnique({ where: { symbol: symbol } })
    return currency;
}

export const getCurrencyByName = async (name) => {
    const currency = await prisma.currency.findUnique({ where: { name: name } })
    return currency;
}

export const getCurrencyById = async (id) => {
    const currency = await prisma.currency.findUnique({ where: { id: id } })
    return currency;
}

export const updateCurrencyCache = async (currencyList) => {

    await redisHelper.set("currencyList", JSON.stringify(currencyList), cache_ttl);
}

export const getCurrencyList = async () => {
    //Check cache first
    const cachedCurrencyList = await redisHelper.get("currencyList");
    if (cachedCurrencyList) {
        return JSON.parse(cachedCurrencyList);
    }

    //If not in cache, get from DB
    const currencyList = await prisma.currency.findMany();
    //Update cache
    await updateCurrencyCache(currencyList);

    return currencyList;
}

export const doFundAccount = async (currency, account, amount) => {
    try {
        const newAccountBalance = Number(account.balance) + Number(amount);
        const currencyBalance = Number(currency.balance) - Number(amount);

        await prisma.$transaction([

            //Update Currency Balance
            prisma.currency.update({
                where: { id: currency.id },
                data: { balance: currencyBalance }
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
