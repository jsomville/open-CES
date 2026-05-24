import '../types/express.d.ts';
import type { NextFunction, Request, Response } from 'express';

import { getCurrencyById, getCurrencyBySymbol, getCurrencyByName, getSafeCurrencyList, createCurrency, updateCurrency, deleteCurrency } from '../services/currency_service.ts';
import { getAccountByNumber, getAccountCountByCurrencyId, createCurrencyMainAccount } from '../services/account_service.ts';

import { transferFunds, doFundAccount, doRefundAccount } from '../services/operation_service.ts';


// @desc Get Currencies
// @route GET /api/currency
export const getAllCurrencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const safeCurrency = await getSafeCurrencyList();

        return res.status(200).json(safeCurrency)
    }
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error obtaining currencies" })
    }
}

// @desc Get Currencies
// @route GET /api/currency
export const getCurrenciesDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const safeCurrency = await getSafeCurrencyList();

        return res.status(200).json(safeCurrency)
    }
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error obtaining currencies" })
    }
}

// @desc Create Currency
// @route POST /api/currency
export const addCurrency = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.validatedBody as { name: string; symbol: string; };

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
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error creating currency" })
    }
}

// @desc Get Currency
// @route GET /api/currency
export const getCurrency = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.validatedParams.id as number;

        //Currency exists
        const currency = await getCurrencyById(id);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        return res.status(200).json(currency)
    }
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error obtaining currency" })
    }
}

// @desc Modify Currencies
// @route PUT /api/currency/id
export const modifyCurrency = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.validatedBody as { name: string; symbol: string; };
        const id = req.validatedParams.id as number;

        //Check if Currency exists
        const currency = await getCurrencyById(id);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        const updatedCurrency = await updateCurrency(id, data);

        return res.status(201).json(updatedCurrency)
    }
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error updating currency" })
    }
}

// @desc Delete Currencies
// @route DELETE /api/currency/id
export const removeCurrency = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currencyId = req.validatedParams.id as number;

        //Currency exists
        const currency = await getCurrencyById(currencyId);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        //Check Currency Main Account first
        let mainAccount: any;
        if (currency.mainCurrencyAccountNumber) {
            mainAccount= await getAccountByNumber(currency.mainCurrencyAccountNumber);
            if (!mainAccount) {
                return res.status(404).json({ message: "Currency main account not found" })
            }
        }

        //Check Currency Reconversion Account first
        let reconversionAccount : any;
        if (currency.reconversionAccountNumber) {
            reconversionAccount = await getAccountByNumber(currency.reconversionAccountNumber);
            if (!reconversionAccount) {
                return res.status(404).json({ message: "Currency reconversion account not found" })
            }
        }

        //Balance must be zero
        if  (mainAccount && reconversionAccount) {
            const balance : number = Number(mainAccount.balance) + Number(reconversionAccount.balance);
            if (balance !== 0) {
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
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error deleting currency" })
    }
}
//@desc Fund account
//@route POST /api/currency/id/fundAccount
export const fundAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currencyId = req.validatedParams.id as number;
        const number = req.validatedBody.number as string;
        const amount = req.validatedBody.amount as number;

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

        const currencyAccount = await getAccountByNumber(currency.mainCurrencyAccountNumber);
        if (!currencyAccount) {
            return res.status(404).json({ error: "Source account not found" })
        }

        //Destination account is the same currency
        if (toAccount.currencyId !== currencyAccount.currencyId) {
            return res.status(422).json({ error: "Accounts must be from the same currency" })
        }


        await doFundAccount(currencyAccount, toAccount, amount);

        return res.status(201).send()
    }
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error Funding the account" })
    }
}

//@desc Refund account
//@route POST /api/currency/id/refundAccount
export const refundAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Account is mandatory
        const currencyId = req.validatedParams.id as number;
        const accountNumber = req.validatedBody.number as string;
        const amount = req.validatedBody.amount as number;

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
        if (fromAccount.balance.lt(amount)) {
            return res.status(400).json({ error: "Insufficient funds" })
        }

        const currencyAccount = await getAccountByNumber(currency.reconversionAccountNumber);
        if (!currencyAccount) {
            return res.status(404).json({ error: "Destination account not found" })
        }

        //Destination account is the same currency
        if (currencyAccount.currencyId !== fromAccount.currencyId) {
            return res.status(422).json({ error: "Accounts must be from the same currency" })
        }

        await doRefundAccount(currencyAccount, fromAccount, amount);

        //Refund the account
        /*try {
            const transferType = "Refund Account"
            const descriptionTo = `Refund from account ${fromAccount.number}`;
            const descriptionFrom = `Refund to account ${toAccount.number}`;
            await transferFunds(transferType, fromAccount, toAccount, amount, descriptionFrom, descriptionTo);
        }
        catch (error : unknown) {
            console.error((error as Error).message);
            return res.status(500).json({ message: "Refund Account Failed" })
        }*/

        return res.status(201).send()
    }
    catch (error : unknown) {
        console.error((error as Error).message);
        return res.status(500).json({ message: "Error refunding the account" })
    }
}



