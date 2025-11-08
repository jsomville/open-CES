import { PrismaClient } from '@prisma/client'
import { getUserByEmail, getUserById, getUserByPhone } from '../services/user_service.js';
import { getCurrencyById, getCurrencyBySymbol } from '../services/currency_service.js';
import { createAccount, transferTo, getAccountById, getAccountByUserIDAndCurrencyId, getTransactionByAccountId, getTransactionByAccountIdAndPage} from '../services/account_service.js';

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

    const accountId = parseInt(req.params.id)
    const account = await prisma.account.findUnique({ where: { id: accountId } })
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

    //Currency exists
    const currency = await getCurrencyById(data.currencyId);
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" })
    }

    //Check User exists
    const user = await getUserById(data.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    //Account exist for this user and this currency
    const account = await prisma.account.findFirst({
      where: {
        userId: parseInt(data.userId),
        currencyId: parseInt(data.currencyId)
      },
    });
    if (account) {
      return res.status(409).json({ message: "Account for this user and this currecny already exists" })
    }

    //Check Currency User Limit
    const accountCount = await prisma.account.count({
      where: {
        currencyId: data.currencyId
      }
    })
    if (accountCount >= currency.accountMax) {
      return res.status(403).json({ message: "Account quota reached" })
    }

    //Create the New account
    const newAccount = await createAccount(data.userId, data.currencyId, data.accountType);

    return res.status(201).json(newAccount)
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
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(422).json({ message: "account Id mandatory" })
    }

    // Account exists
    const account = await prisma.account.findUnique({ where: { id: id } })
    if (!account) {
      return res.status(404).json({ message: "Account not found" })
    }

    //Balance at zero
    if (account.balance > 0) {
      return res.status(409).json({ message: "Balance must be zero" })
    }

    //Delete account
    await prisma.account.delete({
      where: {
        id: id,
      }
    })

    return res.status(204).send()
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Error deleting account" })
  }
};

// @desc Transfer to an Account
// @route POST /api/account/id/transfer
export const transferToAccount = async (req, res, next) => {
  try {

    const id = req.validatedParams.id;
    const accountNumber = req.validatedBody.account;
    const amount = req.validatedBody.amount;
    const description = req.validatedBody.description;

    // Source account exists
    const sourceAccount = await prisma.account.findUnique({ where: { id: id } })
    if (!sourceAccount) {
      return res.status(404).json({ error: "Source account not found" })
    }

    //Check user transfer from own account
    const user = await getUserByEmail(req.user.sub);
    if (sourceAccount.userId != user.id) {
      return res.status(422).json({ error: "Account must be owned by current user" })
    }

    // Destination account exists
    const destinationAccount = await prisma.account.findUnique({ where: { id: accountNumber } })
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

      const result = await transferTo(sourceAccount, destinationAccount, amount, description);

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
    const id = req.validatedParams.id;

    // Source account exists
    const account = await getAccountById(id);
    if (!account) {
      return res.status(404).json({ error: "Source account not found" })
    }

    //Check user access to its own account
    const user = await getUserByEmail(req.user.sub);
    if (account.userId != user.id) {
      return res.status(422).json({ error: "Account must be owned by current user" })
    }

    const transactions = await getTransactionByAccountId(account.id);

    return res.status(200).json(transactions);
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error getting transactions from account" })
  }
};

// @desc Transfer to an Account
// @route POST /api/account/id/transactions
export const getTransactionsByPage = async (req, res, next) => {
  try {
    const id = req.validatedParams.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(`Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    // Source account exists
    const account = await getAccountById(id);
    if (!account) {
      return res.status(404).json({ error: "Source account not found" })
    }

    //Check user access to its own account
    const user = await getUserByEmail(req.user.sub);
    if (account.userId != user.id) {
      return res.status(422).json({ error: "Account must be owned by current user" })
    }

    //Get Transactions
    const transactions = await getTransactionByAccountIdAndPage(account.id, skip, limit);

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

    const account = await getAccountByUserIDAndCurrencyId(user.id, currency.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const safeAccountInfo = {
      id: account.id,
      firstname: user.firstname,
      lastname: user.lastname
    };

    return res.status(200).json(safeAccountInfo);
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

    const account = await getAccountByUserIDAndCurrencyId(user.id, currency.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const safeAccountInfo = {
      id: account.id,
      firstname: user.firstname,
      lastname: user.lastname
    };

    return res.status(200).json(safeAccountInfo);
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error obtaining account info" });
  }
};
