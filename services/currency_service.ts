import { prisma } from '../utils/prisma.ts';

import redisHelper from '../utils/redisHelper.ts';

import { getPersonnalAccountCountByCurrencyId, getMerchantAccountCountByCurrencyId } from './account_service.ts';
import { getAccountId } from '../utils/accountUtil.ts';

const CURRENCY_LIST_CACHE_KEY = "currency:list";
const CURRENCY_LIST_STATS_CACHE_KEY = "currency:list:stats";

export const getCurrencyBySymbol = async (symbol : string) => {
    const currency = await prisma.currency.findUnique({ where: { symbol: symbol } })
    return currency;
}

export const getCurrencyByName = async (name: string) => {
    const currency = await prisma.currency.findUnique({ where: { name: name } })
    return currency;
}

export const getCurrencyById = async (id: number) => {
    const currency = await prisma.currency.findUnique({ where: { id: id } })
    return currency;
}

export const resetCache_CurrencyList = async () => {
    await redisHelper.del(CURRENCY_LIST_CACHE_KEY);
    await redisHelper.del(CURRENCY_LIST_STATS_CACHE_KEY);
}

export const getCurrencyList = async () => {
    //Check cache first
    const cachedCurrencyList = await redisHelper.get(CURRENCY_LIST_CACHE_KEY);
    if (cachedCurrencyList) {
        return JSON.parse(cachedCurrencyList);
    }

    //get from DB
    const currencyList = await prisma.currency.findMany();

    //Update cache
    await redisHelper.set(CURRENCY_LIST_CACHE_KEY, JSON.stringify(currencyList), redisHelper.TTL.one_hour);

    return currencyList;
}

export const getSafeCurrencyList = async () => {

    const currencyList = await getCurrencyList();

    // Remove unwanted fields in list of Currencies
    const safeCurrency = currencyList.map(({ balance, createdAt, updatedAt, activeAccount, accountNextNumber, ...currencies }: any) => currencies);

    return safeCurrency;
}

export const getCurrencyListWithStats = async () => {

    //Retrieve from cache if exists
    const cachedCurrencyListStats = await redisHelper.get(CURRENCY_LIST_STATS_CACHE_KEY);
    if (cachedCurrencyListStats) {
        return JSON.parse(cachedCurrencyListStats);
    }

    const currencyList = await getCurrencyList();

    // For each currency, get stats
    const currencyListWithStats = await Promise.all(currencyList.map(async (currency : any) => {
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

    // Update Cache
    await redisHelper.set(CURRENCY_LIST_STATS_CACHE_KEY, JSON.stringify(currencyListWithStats), redisHelper.TTL.one_hour);

    return currencyListWithStats;
}

export const getSimpleCurrencyList = async () => {
    const currencyList = await getCurrencyList();

    // Return only id, name, symbol
    const simpleCurrencyList = currencyList.map(({id, createdAt, updatedAt, webSiteURL, topOffWizardURL, accountNextNumber, mainCurrencyAccountNumber, ...currencies }: any) => currencies );

    return simpleCurrencyList;
}

export const createCurrency = async (data: any) => {

    //Create Currency in DB
    const currency = await prisma.currency.create({ data });

    //Update Currency List Cache
    await resetCache_CurrencyList();

    return currency;
}

export const updateCurrency = async (id: number, data: any) => {
    const updatedCurrency = await prisma.currency.update({
        where: { id: id },
        data: data
    });

    await resetCache_CurrencyList();

    return updatedCurrency;
}

export const deleteCurrency = async (id: number) => {
    await prisma.currency.delete({
        where: { id: id }
    });

    await resetCache_CurrencyList();
}

export const getNextAccountId = async (symbol: string, accountType: number) => {

    const currency = await getCurrencyBySymbol(symbol);
    if (!currency) {
        throw new Error("Currency not found");
    }

    let startAccountNumber = currency.accountNextNumber;
    let accountExists : boolean = false;
    let accountId : string = "";
    while (!accountExists) {

        startAccountNumber += 1;
        accountId = getAccountId(accountType, currency.id, startAccountNumber);

        accountExists = await prisma.account.count({
            where: { number: accountId }
        }) > 0;
    }

    //Update next number in currency
    await updateCurrency(currency.id, { accountNextNumber: startAccountNumber });

    return accountId;
}

export const deleteCurrencyAndRelatedAccountsBySymbol = async (symbol : string) => {
    const currency = await getCurrencyBySymbol(symbol);
    if (currency) {
        await prisma.account.deleteMany({
            where: {
                currencyId: currency.id
            }
        });

        await prisma.currency.delete({
            where: {
                id: currency.id
            }
        });
    }

    await resetCache_CurrencyList();
}
