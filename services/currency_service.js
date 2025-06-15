import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

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