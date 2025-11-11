import { PrismaClient } from '@prisma/client'
import { getUserByEmail, getUserById, getUserByPhone } from '../services/user_service.js';
import { getCurrencyById, getCurrencyBySymbol } from '../services/currency_service.js';
import { createPersonnalAccount, removeAccount, getAccountById, getAccountByNumber, getUserAccounts } from '../services/account_service.js';
import { getTransactionByAccountNumber, getTransactionByAccountNumberAndPage } from '../services/transaction_service.js';
import { transferFunds } from '../services/transfer_service.js';
import { AccountType } from '../utils/accountUtil.js';
import { getUser } from './userController.js';

const prisma = new PrismaClient();

// @desc Get Account
// @route GET /api/account
export const getAllAccount = async (req, res, next) => {
    try {
        const accounts = await prisma.account.findMany()
        return res.status(200).json(accounts);
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining accounts" })
    }
}

// @desc Get one account
// @toute GET /api/account:id
export const getAccount = async (req, res, next) => {
    try {
        const number = req.validatedParams.number;
        const account = await prisma.account.findUnique({ where: { number: number } })
        if (!account) {
            return res.status(404).json({ message: "Account not found" })
        }

        return res.status(200).json(account);
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining account" });
    }
};

// @desc Create Account
// @route POST /api/account
export const addAccount = async (req, res, next) => {
    try {
        const data = req.validatedBody;

        // Check account type
        if (data.accountType !== AccountType.PERSONAL && data.accountType !== AccountType.BUSINESS) {
            return res.status(409).json({ message: "Invalid account type" })
        }

        //Currency exists
        const currency = await getCurrencyBySymbol(data.symbol);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        // Additional checks for Personal accounts
        if (data.accountType == AccountType.PERSONAL) {
            const user = await getUserById(data.ownerId);
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
        else if (data.accountType == AccountType.BUSINESS) {
            //TODO Merchant
            throw new Error("Business account not yet implemented");
        }
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error creating account" });
    }
};

// @desc Delete a Account
// @route DELETE /api/account/id
export const deleteAccount = async (req, res, next) => {
    try {
        const number = req.validatedParams.number;

        // Account exists
        const account = await prisma.account.findUnique({ where: { number: number } })
        if (!account) {
            return res.status(404).json({ message: "Account not found" })
        }

        //Balance at zero
        if (account.balance > 0) {
            return res.status(409).json({ message: "Balance must be zero" })
        }

        //Delete account
        await removeAccount(number);

        return res.status(204).send()
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: "Error deleting account" })
    }
};

// @desc Transfer to an Account
// @route POST /api/account/number/transfer
export const transferToAccount = async (req, res, next) => {
    try {

        const sourceAccountNumber = req.validatedParams.number;
        const destinationAccountNumber = req.validatedBody.number;
        const amount = req.validatedBody.amount;

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
        catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: "Transfer Failed" })
        }
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error Transfering from account" })
    }

};

// @desc Transfer to an Account
// @route POST /api/account/id/transactions
export const getTransactions = async (req, res, next) => {
    try {
        const accountNumber = req.validatedParams.number;

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
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error getting transactions from account" })
    }
};

// @desc Transfer to an Account
// @route POST /api/account/number/transactions
export const getTransactionsByPage = async (req, res, next) => {
    try {
        const accountNumber = req.validatedParams.number;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

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
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error getting transactions from account" })
    }
};

// get Account info from email and currency
// @route GET /api/account/by-email-and-symbol
export const getAccountInfoByEmailAndSymbol = async (req, res, next) => {
    try {
        const email = req.validatedBody.email;
        const symbol = req.validatedBody.symbol;

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
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining account info" });
    }
};

// get Account info from email and currency
// @route GET /api/account/by-email-and-symbol
export const getAccountInfoByPhoneAndSymbol = async (req, res, next) => {
    try {
        const phone = req.validatedBody.phone;
        const symbol = req.validatedBody.symbol;

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
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining account info" });
    }
};
