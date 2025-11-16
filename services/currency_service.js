import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import redisHelper from '../utils/redisHelper.js';

import { getPersonnalAccountCountByCurrencyId, getMerchantAccountCountByCurrencyId } from './account_service.js';
import { getAccountId } from '../utils/accountUtil.js';

const cached_ttl = 60; //in seconds
const cached_stats_ttl = 900; //in seconds

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

export const setCurrencyInCache = async (currencyList) => {

    await redisHelper.set("currencyList", JSON.stringify(currencyList), cached_ttl);
}

export const updateCurrencyListCache = async () => {
    const currencyList = await prisma.currency.findMany();

    await setCurrencyInCache(currencyList);
}

export const getCurrencyList = async () => {
    //Check cache first
    const cachedCurrencyList = await redisHelper.get("currencyList");
    if (cachedCurrencyList) {
        return JSON.parse(cachedCurrencyList);
    }

    //If not in cache, get from DB
    const currencyList = await prisma.currency.findMany();
    await setCurrencyInCache(currencyList); //Update cache

    return currencyList;
}

export const getSafeCurrencyList = async () => {

    const currencyList = await getCurrencyList();

    // Remove unwanted fields in list of Currencies
    const safeCurrency = currencyList.map(({ balance, accountMax, createdAt, updatedAt, activeAccount, accountNextNumber, ...currencies }) => currencies);

    return safeCurrency;
}

export const getCurrencyListWithStats = async () => {

    const cachedCurrencyListStats = await redisHelper.get("currencyListStats");
    if (cachedCurrencyListStats) {
        return JSON.parse(cachedCurrencyListStats);
    }

    const currencyList = await getCurrencyList();

    // For each currency, get stats
    const currencyListWithStats = await Promise.all(currencyList.map(async (currency) => {
        //Get number of merchants
        const merchantCount = await getMerchantAccountCountByCurrencyId(currency.id);

        //Get number of accounts
        const accountCount = await getPersonnalAccountCountByCurrencyId(currency.id);

        //Get monthly transaction volume for last 30 days
        const monthlyTransVol = await prisma.transaction.aggregate({
            _sum: {
                amount: true
            },
            where: {
                currencyId: currency.id,
                createdAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 30))
                }
            }
        });

        return {
            ...currency,
            merchantCount: merchantCount,
            accountCount: accountCount,
            monthlyTransVol: monthlyTransVol._sum.amount || 0
        };
    }));

    await redisHelper.set("currencyListStats", JSON.stringify(currencyListWithStats), cached_stats_ttl);

    return currencyListWithStats;
}

export const createCurrency = async (data) => {

    //Create Currency in DB
    const currency = await prisma.currency.create({ data });

    //Update Currency List Cache
    await updateCurrencyListCache();

    return currency;
}

export const updateCurrency = async (id, data) => {
    const updatedCurrency = await prisma.currency.update({
        where: { id: id },
        data: data
    });

    await updateCurrencyListCache();

    return updatedCurrency;
}

export const deleteCurrency = async (id) => {
    await prisma.currency.delete({
        where: { id: id }
    });

    await updateCurrencyListCache();
}

export const getNextAccountId = async (symbol, accountType) => {

    const currency = await getCurrencyBySymbol(symbol);
    if (!currency) {
        throw new Error("Currency not found");
    }

    let startAccountNumber = currency.accountNextNumber;
    let accountExists = false;
    let accountId = "";
    while (!accountExists) {

        startAccountNumber += 1;
        accountId = getAccountId(accountType, currency.id, startAccountNumber);

        accountExists = await prisma.account.count({
            where: { accountId: accountId }
        });
    }

    //Update next number in currency
    await modifyCurrency(currency.id, { accountNextNumber: startAccountNumber });

    return accountId;
}
