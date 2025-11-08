import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

export const getMerchantList = async () => {
    const merchants = await prisma.merchant.findMany();
    return merchants;
}

export const getMerchantById = async (id) => {
    const merchant = await prisma.merchant.findUnique({ where: { id: id } });
    return merchant;
}

export const createMerchant = async (data) => {
    const newMerchant = await prisma.merchant.create({ data });
    return newMerchant;
}

export const updateMerchant = async (id, data) => {
    const updatedMerchant = await prisma.merchant.update({
        where: { id: id },
        data: data
    });
    return updatedMerchant;
}

export const deleteMerchant = async (id) => {
    await prisma.merchant.delete({ where: { id: id } });
}

export const deleteMerchantByName = async (name) => {
    await prisma.merchant.deleteMany({ where: { name: name } });
}   