import { getUserByEmail } from '../services/user_service.js';
import { getUserAccounts } from '../services/account_service.js';

import { getLatestTransactionByAccountNumber } from '../services/transaction_service.js';
import { getUserAccountsAndTransactions } from '../services/userAccount_service.js';

const transactionsCount = 5

// @desc Get one user
// @toute GET /api/user/by-email/:email
export const getUserDetailByEmail = async (req, res, next) => {
    try {

        const email = req.validatedParams.email;

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
        for (const account of accounts) {
            const latestTransactions = await getLatestTransactionByAccountNumber(account.id, transactionsCount);
            if (latestTransactions) {
                account.latestTransactions = latestTransactions;
            }
        }

        //assemble user detail
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
export const getMe = async (req, res, next) => {
    try {
        const email = req.user.sub

        //Check if user exists
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        // get User accounts & transactions
        const accounts = await getUserAccounts(user.id);
        for (const account of accounts) {
            const latestTransactions = await getLatestTransactionByAccountNumber(account.number, transactionsCount);
            if (latestTransactions) {
                account.latestTransactions = latestTransactions;
            }
        }

        //assemble user detail
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