import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

export const getTransactionByAccountNumber = async (number) => {
    return await prisma.transaction.findMany({
        where: {
            accountNumber: number
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export const getLatestTransactionByAccountNumber = async (number, transactionCount) => {
    return await prisma.transaction.findMany({
        where: {
            accountNumber: number
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: transactionCount
    });
}

export const getTransactionByAccountNumberAndPage = async (number, skip, limit) => {
    return await prisma.transaction.findMany({
        where: {
            accountNumber: number
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip: skip,
        take: limit
    });
}