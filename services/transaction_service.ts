import { prisma } from '../utils/prisma.ts';

export const getTransactionByAccountNumber = async (number: string) => {
    return await prisma.transaction.findMany({
        where: {
            accountNumber: number
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export const getLatestTransactionByAccountNumber = async (number: string, transactionCount: number) => {
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

export const getTransactionByAccountNumberAndPage = async (number: string, skip: number, limit: number) => {
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