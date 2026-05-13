import '../types/express.d.ts';
import type { NextFunction, Request, Response } from 'express';

import { getUserByEmail } from '../services/user_service.ts';
import { getUserAccounts } from '../services/account_service.ts';

import { getLatestTransactionByAccountNumber } from '../services/transaction_service.ts';

const transactionsCount = 5

// @desc Get one user
// @route GET /api/user/by-email/:email
export const getUserDetailByEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const email = req.validatedParams.email as string;

        //Check if user exists
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        //Check if self
        if (req.user.sub !== user.email) {
            return res.status(403).json({ error: "Forbidden: Insufficient role" })
        }

        // get User accounts & transactions
        const accounts = await getUserAccounts(user.id);
        const accountsWithTransactions = await Promise.all(
            accounts.map(async (account) => {
                const latestTransactions = await getLatestTransactionByAccountNumber(account.number, transactionsCount);
                return {
                    ...account,
                    ...(latestTransactions && { latestTransactions })
                };
            })
        );

        //assemble user detail
        const userDetail = {
            ...user,
            accounts: accountsWithTransactions
        }

        return res.status(200).json(userDetail);
    }
    catch (error : unknown) {
        console.error(error)
        return res.status(500).json({ error: (error as Error).message })
    }
};

// @desc Get one user
// @toute GET /api/user/me
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.user.sub

        //Check if user exists
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        // get User accounts & transactions
        const accounts = await getUserAccounts(user.id);
        const accountsWithTransactions = await Promise.all(
            accounts.map(async (account) => {
                const latestTransactions = await getLatestTransactionByAccountNumber(account.number, transactionsCount);
                return {
                    ...account,
                    ...(latestTransactions && { latestTransactions })
                };
            })
        );

        //assemble user detail
        const userDetail = {
            ...user,
            accounts: accountsWithTransactions
        }

        return res.status(200).json(userDetail);
    }
    catch (error : unknown) {
        console.error(error)
        return res.status(500).json({ error: (error as Error).message })
    }
};