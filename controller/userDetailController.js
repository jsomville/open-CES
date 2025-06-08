import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

import { getUserByEmail } from './userController.js';

const transactionPerAccount = 5

// @desc Get one user
// @toute GET /api/user:id
export const getUserDetail = async (req, res, next) => {
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
                take: transactionPerAccount,
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
        console.log(error.message)
        return res.status(500).json({ error: error.message })
    }
};