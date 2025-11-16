import { getCurrencyById, getCurrencyBySymbol, getCurrencyByName, getSafeCurrencyList, createCurrency, updateCurrency, deleteCurrency } from '../services/currency_service.js';
import { getAccountByNumber, getAccountCountByCurrencyId } from '../services/account_service.js';
import { transferFunds } from '../services/transfer_service.js';
import { createCurrencyMainAccount } from '../services/account_service.js';

// @desc Get Currencies
// @route GET /api/currency
export const getAllCurrencies = async (req, res, next) => {
    try {
        const safeCurrency = await getSafeCurrencyList();

        return res.status(200).json(safeCurrency)
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining currencies" })
    }
}

// @desc Get Currencies
// @route GET /api/currency
export const getCurrenciesDetails = async (req, res, next) => {
    try {
        const safeCurrency = await getSafeCurrencyList();

        return res.status(200).json(safeCurrency)
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining currencies" })
    }
}

// @desc Create Currency
// @route POST /api/currency
export const addCurrency = async (req, res, next) => {
    try {
        const data = req.validatedBody;

        //Check if Name is unique
        let currency;
        currency = await getCurrencyByName(data.name);
        if (currency) {
            return res.status(409).json({ message: "Name must be unique" })
        }

        //Check if Symbol is unique
        currency = await getCurrencyBySymbol(data.symbol);
        if (currency) {
            return res.status(409).json({ message: "Symbol must be unique" })
        }

        //Create Currency
        const newCurrency = await createCurrency(data);


        //Create Currency Main account
        await createCurrencyMainAccount(newCurrency);

        return res.status(201).json(newCurrency)
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error creating currency" })
    }
}

// @desc Get Currency
// @route GET /api/currency
export const getCurrency = async (req, res, next) => {
    try {
        const id = req.validatedParams.id;

        //Currency exists
        const currency = await getCurrencyById(id);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        return res.status(200).json(currency)
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error obtaining currency" })
    }
}

// @desc Modify Currencies
// @route PUT /api/currency/id
export const modifyCurrency = async (req, res, next) => {
    try {
        const data = req.validatedBody;
        const id = req.validatedParams.id;

        //Check if Currency exists
        const currency = await getCurrencyById(id);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        const updatedCurrency = await updateCurrency(id, data);

        return res.status(201).json(updatedCurrency)
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error updating currency" })
    }
}

// @desc Delete Currencies
// @route DELETE /api/currency/id
export const removeCurrency = async (req, res, next) => {
    try {
        const currencyId = req.validatedParams.id;

        //Currency exists
        const currency = await getCurrencyById(currencyId);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        //Check Currency Main Account first
        let mainAccountNumber = null;
        if (currency.mainCurrencyAccountNumber) {
            const account = await getAccountByNumber(currency.mainCurrencyAccountNumber);
            if (!account) {
                return res.status(404).json({ message: "Currency main account not found" })
            }
            mainAccountNumber = account.number;

            //Balance must be zero
            if (Number(account.balance) !== 0) {
                return res.status(422).json({ message: "Balance must be zero" })
            }
        }

        //Get Number of Other Accounts (excluding main account) - Check if currency is being used
        const accountCount = await getAccountCountByCurrencyId(currencyId);

        if (accountCount > 0) {
            return res.status(409).json({ message: `Currency id is being used in ${accountCount} account(s)` })
        }

        // Delete Currency
        await deleteCurrency(currencyId);

        return res.status(204).send()
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error deleting currency" })
    }
}
//@desc Fund account
//@route POST /api/currency/id/fundAccount
export const fundAccount = async (req, res, next) => {
    try {
        const currencyId = req.validatedParams.id;
        const number = req.validatedBody.number;
        const amount = req.validatedBody.amount;

        //Currency exists
        const currency = await getCurrencyById(currencyId);
        if (!currency) {
            return res.status(404).json({ error: "Currency not found" })
        }

        // Destination account exists
        const toAccount = await getAccountByNumber(number);
        if (!toAccount) {
            return res.status(404).json({ error: "Destination account not found" })
        }

        const fromAccount = await getAccountByNumber(currency.mainCurrencyAccountNumber);
        if (!fromAccount) {
            return res.status(404).json({ error: "Source account not found" })
        }

        //Destination account is the same currency
        if (toAccount.currencyId !== fromAccount.currencyId) {
            return res.status(422).json({ error: "Accounts must be from the same currency" })
        }

        //Fund the account
        try {
            const transferType = "Fund Account"
            const descriptionTo = `Fund from account ${fromAccount.number}`;
            const descriptionFrom = `Fund to account ${toAccount.number}`;
            await transferFunds(transferType, fromAccount, toAccount, amount, descriptionFrom, descriptionTo);

        }
        catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: "Fund Account Failed" })
        }

        return res.status(201).send()
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error Funding the account" })
    }
}

//@desc Refund account
//@route POST /api/currency/id/refundAccount
export const refundAccount = async (req, res, next) => {
    try {
        //Account is mandatory
        const currencyId = req.validatedParams.id;
        const accountNumber = req.validatedBody.number;
        const amount = req.validatedBody.amount;

        //Currency exists
        const currency = await getCurrencyById(currencyId);
        if (!currency) {
            return res.status(404).json({ error: "Currency not found" })
        }

        // Destination account exists
        const fromAccount = await getAccountByNumber(accountNumber);
        if (!fromAccount) {
            return res.status(404).json({ error: "Source account not found" })
        }

        //Amount is below of equal account balance
        if (fromAccount.balance < amount) {
            return res.status(400).json({ error: "Insufficient funds" })
        }

        const toAccount = await getAccountByNumber(currency.mainCurrencyAccountNumber);
        if (!toAccount) {
            return res.status(404).json({ error: "Destination account not found" })
        }

        //Destination account is the same currency
        if (toAccount.currencyId !== fromAccount.currencyId) {
            return res.status(422).json({ error: "Accounts must be from the same currency" })
        }

        //Refund the account
        try {
            const transferType = "Refund Account"
            const descriptionTo = `Refund from account ${fromAccount.number}`;
            const descriptionFrom = `Refund to account ${toAccount.number}`;
            await transferFunds(transferType, fromAccount, toAccount, amount, descriptionFrom, descriptionTo);
        }
        catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: "Fund Account Failed" })
        }

        return res.status(201).send()
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error refunding the account" })
    }
}



