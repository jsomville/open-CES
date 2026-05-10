import { prisma } from '../utils/prisma.ts';

export const getMerchantList = async () => {
    const merchants = await prisma.merchant.findMany();
    return merchants;
}

export const getMerchantById = async (id: number) => {
    const merchant = await prisma.merchant.findUnique({ where: { id: id } });
    return merchant;
}

export const createMerchant = async (data: any) => {
    const newMerchant = await prisma.merchant.create({ data });
    return newMerchant;
}

export const updateMerchant = async (id: number, data : any) => {
    const updatedMerchant = await prisma.merchant.update({
        where: { id: id },
        data: data
    });
    return updatedMerchant;
}

export const deleteMerchant = async (id: number) => {
    await prisma.merchant.delete({ where: { id: id } });
}

export const deleteMerchantByName = async (name: string) => {
    await prisma.merchant.deleteMany({ where: { name: name } });
}   