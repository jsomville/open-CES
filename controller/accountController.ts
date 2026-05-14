import '../types/express.d.ts';
import type { NextFunction, Request, Response } from 'express';

import { getUserByEmail, getUserById, getUserByPhone } from '../services/user_service.ts';
import { getCurrencyBySymbol } from '../services/currency_service.ts';
import { getAccounts, createPersonnalAccount, deleteAccount, getAccountByNumber, getUserAccounts } from '../services/account_service.ts';
import { getTransactionByAccountNumber, getTransactionByAccountNumberAndPage } from '../services/transaction_service.ts';
import { transferFunds } from '../services/operation_service.ts';
import { AccountType } from '../utils/accountUtil.ts';

// @desc Get Account
// @route GET /api/account
export const getAllAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accounts = await getAccounts();

        return res.status(200).json(accounts);
    }
    catch (error : unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error obtaining accounts" })
    }
}

// @desc Get one account
// @toute GET /api/account:id
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const number = req.validatedParams.number as string;
        const account = await getAccountByNumber(number);
        if (!account) {
            return res.status(404).json({ message: "Account not found" })
        }

        return res.status(200).json(account);
    }
    catch (error : unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error obtaining account" });
    }
};

// @desc Create Account
// @route POST /api/account
export const addAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.validatedBody as {
            accountType: number;
            symbol: string;
            ownerId?: number;
            merchantEmail?: string;
        };

        // Check account type
        if (data.accountType !== AccountType.PERSONAL && data.accountType !== AccountType.MERCHANT) {
            return res.status(409).json({ message: "Invalid account type" })
        }

        //Currency exists
        const currency = await getCurrencyBySymbol(data.symbol as string);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        // Additional checks for Personal accounts
        if (data.accountType == AccountType.PERSONAL) {
            if (!data.ownerId) {
                return res.status(400).json({ message: "ownerId is required for personal accounts" })
            }
            const user = await getUserById(data.ownerId as number);
            if (!user) {
                return res.status(404).json({ message: "User not found" })
            }

            //get User accounts
            const userAccounts = await getUserAccounts(user.id);
            if (userAccounts.length > 0) {
                // Check if user already has an account in this currency
                const existingAccount = userAccounts.find(account => account.currencyId === currency.id);
                if (existingAccount) {
                    return res.status(409).json({ message: "Account for this user and this currency already exists" })
                }
            }

            //Create User account link to Personal account
            const newAccount = await createPersonnalAccount(user, data.symbol);

            return res.status(201).json(newAccount)
        }
        else if (data.accountType == AccountType.MERCHANT) {
            //TODO Merchant
            throw new Error("Merchant account not yet implemented");
        }
    }
    catch (error : unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error creating account" });
    }
};

// @desc Delete a Account
// @route DELETE /api/account/id
export const removeAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const number = req.validatedParams.number as string;

        // Account exists
        const account = await getAccountByNumber(number);
        if (!account) {
            return res.status(404).json({ message: "Account not found" })
        }

        //Balance at zero
        if (account.balance.gt(0)) {
            return res.status(409).json({ message: "Balance must be zero" })
        }

        //Delete account
        await deleteAccount(number);

        return res.status(204).send()
    }
    catch (error : unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ error: "Error deleting account" })
    }
};

// @desc Transfer to an Account
// @route POST /api/account/number/transfer
export const transferToAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const sourceAccountNumber = req.validatedParams.number as string;
        const destinationAccountNumber = req.validatedBody.number as string;
        const amount = req.validatedBody.amount as number;

        // Source account exists
        const sourceAccount = await getAccountByNumber(sourceAccountNumber);
        if (!sourceAccount) {
            return res.status(404).json({ error: "Source account not found" })
        }

        //Check user transfer from own account
        const user = await getUserByEmail(req.user.sub);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        //get User accounts
        const userAccounts = await getUserAccounts(user.id);
        if (!userAccounts) {
            return res.status(404).json({ error: "No accounts found for user" });
        }

        //Account must be owned by current user
        if (!userAccounts.some(acc => acc.id === sourceAccount.id)) {
            return res.status(422).json({ error: "Account must be owned by current user" })
        }

        // Destination account exists
        const destinationAccount = await getAccountByNumber(destinationAccountNumber);
        if (!destinationAccount) {
            return res.status(404).json({ error: "Destination account not found" })
        }

        //Source and Destination are different accounts
        if (sourceAccount.id === destinationAccount.id) {
            return res.status(422).json({ error: "Cannot transfer to same account" })
        }

        //Source and Destination using the same currency
        if (sourceAccount.currencyId != destinationAccount.currencyId) {
            return res.status(422).json({ error: "Accounts must be from the same currency" })
        }

        //Sufficient Funds
        if (Number(sourceAccount.balance) < amount) {
            return res.status(400).json({ error: "Insufficient funds" })
        }

        try {

            const userString = user.firstname + " " + user.lastname;
            const descriptionFrom = `From ${sourceAccount.number} (${userString})`;
            const descriptionTo = `To ${destinationAccount.number}`;

            const result = await transferFunds("Transfer", sourceAccount, destinationAccount, amount, descriptionFrom, descriptionTo);

            if (!result) {
                return res.status(500).json({ message: "Transfer Failed" })
            }

            return res.status(201).send()
        }
        catch (error : unknown) {
            if (error instanceof Error) {
                console.error(error.message);
            }
            return res.status(500).json({ message: "Transfer Failed" })
        }
    }
    catch (error : unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error Transfering from account" })
    }

};

// @desc Transfer to an Account
// @route POST /api/account/id/transactions
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accountNumber = req.validatedParams.number as string;

        // Source account exists
        const account = await getAccountByNumber(accountNumber);
        if (!account) {
            return res.status(404).json({ error: "Source account not found" })
        }

        if (req.user.role !== "admin") {
            // Check if its own account
            const user = await getUserByEmail(req.user.sub);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const accounts = await getUserAccounts(user.id);
            if (!accounts) {
                return res.status(404).json({ error: "No accounts found for user" });
            }
            const isOwnAccount = accounts.some(acc => acc.id === account.id);
            if (!isOwnAccount) {
                return res.status(422).json({ error: "Account must be owned by current user" })
            }
        }

        //Get Transactions
        const transactions = await getTransactionByAccountNumber(account.number);

        return res.status(200).json(transactions);
    }
    catch (error : unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error getting transactions from account" })
    }
};

// @desc Transfer to an Account
// @route POST /api/account/number/transactions
export const getTransactionsByPage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accountNumber = req.validatedParams.number as string;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;


        // Source account exists
        const account = await getAccountByNumber(accountNumber);
        if (!account) {
            return res.status(404).json({ error: "Source account not found" })
        }

        const role = req.user.role;
        const email = req.user.sub;

        if (role !== "admin") {
            // Check if its own account
            const user = await getUserByEmail(email);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const accounts = await getUserAccounts(user.id);
            if (!accounts) {
                return res.status(404).json({ error: "No accounts found for user" });
            }
            const isOwnAccount = accounts.some(acc => acc.id === account.id);
            if (!isOwnAccount) {
                return res.status(422).json({ error: "Account must be owned by current user" })
            }
        }

        //Get Transactions
        const transactions = await getTransactionByAccountNumberAndPage(account.number, skip, limit);

        const totalCount = transactions.length;
        const totalPages = Math.ceil(totalCount / limit);

        const pagination = {
            totalCount: totalCount,
            totalPages: totalPages,
            currentPage: page,
        };

        return res.status(200).json({ transactions, pagination });
    }
    catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error getting transactions from account" })
    }
};

// get Account info from email and currency
// @route GET /api/account/by-email-and-symbol
export const getAccountInfoByEmailAndSymbol = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.validatedBody.email as string;
        const symbol = req.validatedBody.symbol as string;

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currency = await getCurrencyBySymbol(symbol);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" });
        }

        const accounts = await getUserAccounts(user.id);
        if (accounts.length > 0) {
            // Check if user has an account in this currency
            const account = accounts.find(account => account.currencyId === currency.id);
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }

            //get Safe account info
            const safeAccountInfo = {
                id: account.id,
                firstname: user.firstname,
                lastname: user.lastname
            };

            return res.status(200).json(safeAccountInfo);
        }
        else {
            return res.status(404).json({ message: "No Account found" });
        }

    }
    catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error obtaining account info" });
    }
};

// get Account info from email and currency
// @route GET /api/account/by-email-and-symbol
export const getAccountInfoByPhoneAndSymbol = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const phone = req.validatedBody.phone as string;
        const symbol = req.validatedBody.symbol as string;

        const user = await getUserByPhone(phone);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currency = await getCurrencyBySymbol(symbol);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" });
        }

        const accounts = await getUserAccounts(user.id);
        if (accounts.length > 0) {
            // Check if user has an account in this currency
            const account = accounts.find(account => account.currencyId === currency.id);
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }

            //get Safe account info
            const safeAccountInfo = {
                id: account.id,
                firstname: user.firstname,
                lastname: user.lastname
            };

            return res.status(200).json(safeAccountInfo);
        }
        else {
            return res.status(404).json({ message: "No Account found" });
        }
    }
    catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        return res.status(500).json({ message: "Error obtaining account info" });
    }
};
