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
