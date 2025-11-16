import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const VoucherStatus = Object.freeze({
    ISSUED : 'ISSUED',
    REDEEMED : 'REDEEMED',
    EXPIRED : 'EXPIRED',
});

export const getVouchers = async () => {
    const vouchers = await prisma.voucher.findMany();
    return vouchers;
}

export const createVoucher = async (code, amount, currencyId, expirationDate) => {
    const newVoucher = await prisma.voucher.create({
        data: {
            code: code,
            amount: amount,
            currencyId: currencyId,
            expiration: expirationDate,
            status: VoucherStatus.ISSUED,
        },
    });
    return newVoucher;
}

export const updateVoucher = async (voucherId, expiration) => {
    const updatedVoucher = await prisma.voucher.update({
        data: {
            expiration: expiration
        },
        where: {
            id: voucherId
        }
    })

    return updatedVoucher
}

export const getVoucherById = async (voucherId) => {
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
    return voucher;
};

export const getVoucherByCode = async (code) => {
    const voucher = await prisma.voucher.findUnique({ where: { code: code } });
    return voucher;
};

export const claimVoucherService = async (voucher, account) => {

    const newBalance = account.balance + voucher.amount;

    await prisma.$transaction([
        prisma.voucher.update({
            data: {
                status: VoucherStatus.REDEEMED
            },
            where: {
                id: voucher.id
            }
        }),
        prisma.account.update({
            data: {
                balance: newBalance
            },
            where: {
                number: account.number
            }
        }),
        prisma.transaction.create({
            data: {
                accountNumber: account.number,
                amount: voucher.amount,
                currencyId: account.currencyId,
                transactionType: "Claim Voucher",
                description: `Claim Voucher # ${voucher.id}`,
                status: "Completed"
            }
        }),
    ])
}