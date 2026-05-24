import redisHelper from '../utils/redisHelper.ts';
import { prisma } from '../utils/prisma.ts';

import { getAccountByNumber, getPersonnalAccountCountByCurrencyId, getMerchantAccountCountByCurrencyId, getActiveAccountCountByCurrencyId } from './account_service.ts';

import {getCurrencyList} from './currency_service.ts';

const CURRENCY_LIST_STATS_CACHE_KEY = "currency:list:stats";

export const getCurrencyListWithStats = async () => {

    //Retrieve from cache if exists
    /*const cachedCurrencyListStats = await redisHelper.get(CURRENCY_LIST_STATS_CACHE_KEY);
    if (cachedCurrencyListStats) {
        return JSON.parse(cachedCurrencyListStats);
    }*/

    const currencyList = await getCurrencyList();

    // For each currency, get stats
    const currencyListWithStats = await Promise.all(currencyList.map(async (currency : any) => {
        //Get number of merchants
        const merchantAccountCount = await getMerchantAccountCountByCurrencyId(currency.id);

        //Get number of accounts
        const personalAccountCount = await getPersonnalAccountCountByCurrencyId(currency.id);

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

        const activeAccount = await getActiveAccountCountByCurrencyId(currency.id);

        let balance : number = 0;
        if (currency.mainCurrencyAccountNumber && currency.reconversionAccountNumber) {
            const mainAccount = await getAccountByNumber(currency.mainCurrencyAccountNumber)
            const reconversionAccount = await getAccountByNumber(currency.reconversionAccountNumber)

            if (mainAccount && reconversionAccount) {
                balance = mainAccount.balance.sub(reconversionAccount.balance).toNumber() * -1;
            }
        }

        return {
            ...currency,
            merchantAccountCount,
            personalAccountCount,
            balance,
            monthlyTransVol: monthlyTransVol._sum.amount || 0,
            activeAccount
        };
    }));

    // Update Cache
    await redisHelper.set(CURRENCY_LIST_STATS_CACHE_KEY, JSON.stringify(currencyListWithStats), redisHelper.TTL.one_hour);

    return currencyListWithStats;
}