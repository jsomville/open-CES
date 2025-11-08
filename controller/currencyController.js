import { getCurrencyById, getCurrencyBySymbol, getCurrencyByName, getSafeCurrencyList, createCurrency, modifyCurrency, removeCurrency, doFundAccount, doRefundAccount} from '../services/currency_service.js';
import { getAccountById, getAccountCountByCurrencyId} from '../services/account_service.js';


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
export const updateCurrency = async (req, res, next) => {
  try {
    const data = req.validatedBody;
    const id = req.validatedParams.id;

    //Check if Currency exists
    const currency = await getCurrencyById(id);
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" })
    }

    const updatedCurrency = await modifyCurrency(id, data);

    return res.status(201).json(updatedCurrency)
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error updating currency" })
  }
}

// @desc Delete Currencies
// @route DELETE /api/currency/id
export const deleteCurrency = async (req, res, next) => {
  try {
    const currencyId = req.validatedParams.id;

    //Currency exists
    const currency = await getCurrencyById(currencyId);
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" })
    }

    //Balance must be zero
    if (Number(currency.balance) !== 0) {
      return res.status(422).json({ message: "Balance must be zero" })
    }

    //Get Number of Account
    const accountCount = await getAccountCountByCurrencyId(currencyId);
    if (accountCount) {
      return res.status(409).json({ message: `Currency id is being used in ${accountCount} account(s)` })
    }

    // Delete Currency
    await removeCurrency(currencyId);

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
    const accountNumber = req.validatedBody.account;
    const amount = req.validatedBody.amount;

    //Currency exists
    const currency = await getCurrencyById(currencyId);
    if (!currency) {
      return res.status(404).json({ error: "Currency not found" })
    }

    // Destination account exists
    const account = await getAccountById(accountNumber);
    if (!account) {
      return res.status(404).json({ error: "Destination account not found" })
    }

    //Destination account is the same currency
    if (currency.id != account.currencyId) {
      return res.status(422).json({ error: "Accounts must be from the same currency" })
    }

    //Fund the account
    try {

      await doFundAccount(currency, account, amount);

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
    const accountNumber = req.validatedBody.account;
    const amount = req.validatedBody.amount;

    //Currency exists
    const currency = await getCurrencyById(currencyId);
    if (!currency) {
      return res.status(404).json({ error: "Currency not found" })
    }

    // Destination account exists
    const account = await getAccountById(accountNumber);
    if (!account) {
      return res.status(404).json({ error: "Destination account not found" })
    }

    //Destination account is the same currency
    if (currency.id != account.currencyId) {
      return res.status(422).json({ error: "Accounts must be from the same currency" })
    }

    //Amount is below of equal account balance
    if (account.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" })
    }

    //Refund the account
    try {
      await doRefundAccount(currency, account, amount);
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



