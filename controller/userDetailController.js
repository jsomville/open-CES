import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

import { getUserByEmail, getUserAccountsAndTransactions } from '../services/user_service.js';

import { getCurrencyById } from '../services/currency_service.js';

import { getLatestTransactionByAccountId } from '../services/account_service.js';

const transactionsCount = 5

// @desc Get one user
// @toute GET /api/user/by-email/:email
export const getUserDetailByEmail = async (req, res, next) => {
    try {
        
       //Check if email is provided
        if (!req.params.email) {
            return res.status(422).json({ error: "Email required" });
        }

        //Check if user exists
        const user = await getUserByEmail(req.params.email);
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        //Check if self
        if (req.user.sub !== user.email) {
            return res.status(403).json({ error: "Forbidden: Insufficient role" })
        }

        const accounts = await prisma.account.findMany({ where: { userId: user.id } });
        for (const account of accounts) {
            const latestTransactions = await prisma.transaction.findMany({
                where: { accountId: account.id },
                orderBy: { createdAt: 'desc' },
                take: transactionsCount,
            });
            if (latestTransactions) {
                account.latestTransactions = latestTransactions;
            }
        }

        const userDetail = {
            ...user,
            accounts: accounts.map(account => ({
                ...account,
            }))
        }

        return res.status(200).json(userDetail);
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ error: error.message })
    }
};

// @desc Get one user
// @toute GET /api/user/me
export const getUserDetail = async (req, res, next) => {
    try {
        const email = req.user.sub;

        //Check if user exists
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        // get accounts & transactions
        const accounts = await prisma.account.findMany({ where: { userId: user.id } });
        for (const account of accounts) {

            // Add the currency symbol
            const currency = await getCurrencyById(account.currencyId);
            if (currency) {
                account.currencySymbol = currency.symbol;
            };

            // get the last transactions
            /*const latestTransactions = await prisma.transaction.findMany({
                where: { accountId: account.id },
                orderBy: { createdAt: 'desc' },
                take: transactionsCount,
            });*/
            const latestTransactions = await getLatestTransactionByAccountId(account.id, transactionsCount);

            if (latestTransactions) {
                account.latestTransactions = latestTransactions;
            };
        }

        const userDetail = {
            ...user,
            accounts: accounts.map(account => ({
                ...account,
            }))
        }

        return res.status(200).json(userDetail);
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ error: error.message })
    }
};