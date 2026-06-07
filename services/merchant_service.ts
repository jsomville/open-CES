import { prisma } from '../utils/prisma.ts';

import redisHelper from '../utils/redisHelper.ts';

const MERCHANT_LIST_CACHE_KEY = "merchant:list";

export const getMerchantList = async () => {
    //get list from cache
    const cachedMerchantList = await redisHelper.get(MERCHANT_LIST_CACHE_KEY);
    if (cachedMerchantList) {
        return JSON.parse(cachedMerchantList);
    }
    //get Merchant list from DB
    const merchants = await prisma.merchant.findMany();

    // update cache
    await redisHelper.set(MERCHANT_LIST_CACHE_KEY, JSON.stringify(merchants), redisHelper.TTL.one_hour);

    return merchants;
}

export const getMerchantById = async (id: number) => {
    const merchant = await prisma.merchant.findUnique({ where: { id: id } });
    return merchant;
}

export const createMerchant = async (data: any) => {

    await resetMerchantListCache();

    const newMerchant = await prisma.merchant.create({ data });
    return newMerchant;
}

export const resetMerchantListCache = async () => {
    await redisHelper.del(MERCHANT_LIST_CACHE_KEY);
}   

export const updateMerchant = async (id: number, data : any) => {
    const updatedMerchant = await prisma.merchant.update({
        where: { id: id },
        data: data
    });
    await resetMerchantListCache();
    return updatedMerchant;
}

export const deleteMerchant = async (id: number) => {
    await prisma.merchant.delete({ where: { id: id } });
    await resetMerchantListCache();
}

export const deleteMerchantByName = async (name: string) => {
    await prisma.merchant.deleteMany({ where: { name: name } });
    await resetMerchantListCache();
}   