import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getVoucherById = async (voucherId) => {
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
    return voucher;
};

export const getVoucherByCode = async (code) => {
    const voucher = await prisma.voucher.findUnique({ where: { code: code } });
    return voucher;
};